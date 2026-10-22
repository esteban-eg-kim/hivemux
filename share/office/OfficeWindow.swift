// The bee office window (bin/hivemux-office builds this with swiftc on first use).
// 벌 사무실 창 (bin/hivemux-office 가 처음 쓸 때 swiftc 로 빌드한다).
//   OfficeWindow <url> <icon.png> <pidfile> [<python> <hivemux-office>]
// A plain window around a web view of the local page. The page talks back through
// window.webkit.messageHandlers.office: {"top": true|false} keeps the window above others,
// {"front": true} brings it forward without taking the keyboard (a bee popping out).
// {"revive": true} (the page lost its server) and a page that will not load start the server again.
// SIGUSR1 (hivemux-office run again) brings it to the front.
// 로컬 페이지를 보여 주는 웹 뷰 하나짜리 창. 페이지는 window.webkit.messageHandlers.office 로 말한다:
// {"top": true|false} 다른 창 위에 띄우기, {"front": true} 키보드는 뺏지 않고 앞으로 (벌이 튀어나올 때).
// {"revive": true} (페이지가 서버를 잃음) 이나 페이지가 안 열리면 서버를 다시 띄운다.
// SIGUSR1 (hivemux-office 를 다시 실행) 을 받으면 앞으로 나온다.
import Cocoa
import WebKit

let args = CommandLine.arguments
let pageURL = URL(string: args.count > 1 ? args[1] : "http://127.0.0.1:47380/")!
let iconPath = args.count > 2 ? args[2] : ""
let pidFile = args.count > 3 ? args[3] : ""
let server = args.count > 5 ? [args[4], args[5]] : []
let topKey = "hivemux-office-top"

final class Office: NSObject, NSApplicationDelegate, NSWindowDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var window: NSWindow!
    var web: WKWebView!
    var signalSource: DispatchSourceSignal?
    var topItem: NSMenuItem!
    var revived = Date.distantPast

    // start hivemux-office serve again, at most every 10 s (one already running just quits)
    // hivemux-office serve 를 다시 띄운다, 10초에 한 번까지 (이미 돌고 있으면 새것은 그냥 끝난다)
    func revive() {
        guard server.count == 2, Date().timeIntervalSince(revived) > 10 else { return }
        revived = Date()
        let p = Process()
        p.executableURL = URL(fileURLWithPath: server[0])
        p.arguments = [server[1], "serve"]
        p.standardInput = FileHandle.nullDevice; p.standardOutput = FileHandle.nullDevice; p.standardError = FileHandle.nullDevice
        try? p.run()
    }

    func applicationDidFinishLaunching(_ note: Notification) {
        if let img = NSImage(contentsOfFile: iconPath) { NSApp.applicationIconImage = img }
        let cfg = WKWebViewConfiguration()
        cfg.userContentController.add(self, name: "office")
        cfg.mediaTypesRequiringUserActionForPlayback = []
        web = WKWebView(frame: .zero, configuration: cfg)
        web.navigationDelegate = self
        web.setValue(false, forKey: "drawsBackground")

        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 760, height: 620),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "hivemux"
        window.contentView = web
        window.minSize = NSSize(width: 420, height: 360)
        window.delegate = self
        window.isReleasedWhenClosed = false
        if !window.setFrameUsingName("hivemux-office") { window.center() }
        window.setFrameAutosaveName("hivemux-office")
        setTop(UserDefaults.standard.bool(forKey: topKey))
        buildMenu()

        web.load(URLRequest(url: pageURL))
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)

        if !pidFile.isEmpty { try? "\(getpid())".write(toFile: pidFile, atomically: true, encoding: .utf8) }
        signal(SIGUSR1, SIG_IGN)
        let src = DispatchSource.makeSignalSource(signal: SIGUSR1, queue: .main)
        src.setEventHandler { [weak self] in
            self?.window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }
        src.resume()
        signalSource = src
    }

    func buildMenu() {
        let main = NSMenu()
        let appItem = NSMenuItem(); main.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "Quit hivemux office", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        let viewItem = NSMenuItem(); main.addItem(viewItem)
        let viewMenu = NSMenu(title: "View")
        topItem = viewMenu.addItem(withTitle: "Keep on Top", action: #selector(toggleTop), keyEquivalent: "t")
        topItem.target = self
        topItem.state = window.level == .floating ? .on : .off
        let reload = viewMenu.addItem(withTitle: "Reload", action: #selector(reloadPage), keyEquivalent: "r")
        reload.target = self
        viewMenu.addItem(withTitle: "Close Window", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        viewItem.submenu = viewMenu
        NSApp.mainMenu = main
    }

    func setTop(_ on: Bool) {
        window.level = on ? .floating : .normal
        window.collectionBehavior = on ? [.canJoinAllSpaces, .fullScreenAuxiliary] : []
        UserDefaults.standard.set(on, forKey: topKey)
        topItem?.state = on ? .on : .off
        web?.evaluateJavaScript("window.officeTop && window.officeTop(\(on))", completionHandler: nil)
    }

    @objc func toggleTop() { setTop(window.level != .floating) }
    @objc func reloadPage() { web.reload() }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        web.evaluateJavaScript("window.officeTop && window.officeTop(\(window.level == .floating))", completionHandler: nil)
    }

    // the server went away (idle exit, reboot): retry until hivemux-office starts one again
    // 서버가 없어짐 (유휴 종료, 재부팅): hivemux-office 가 다시 띄울 때까지 다시 시도
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        revive()
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in self?.web.load(URLRequest(url: pageURL)) }
    }

    func userContentController(_ c: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any] else { return }
        if let on = body["top"] as? Bool { setTop(on) }
        if body["revive"] as? Bool == true { revive() }
        if body["front"] as? Bool == true {
            if window.isMiniaturized { window.deminiaturize(nil) }
            window.orderFrontRegardless()
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ app: NSApplication) -> Bool { true }

    func applicationWillTerminate(_ note: Notification) {
        if !pidFile.isEmpty { try? FileManager.default.removeItem(atPath: pidFile) }
    }
}

let app = NSApplication.shared
let office = Office()
app.delegate = office
app.setActivationPolicy(.regular)
app.run()
