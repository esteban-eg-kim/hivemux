# Homebrew formula. Put this in a tap repository named esteban-eg-kim/homebrew-tap
# (Formula/hivemux.rb), then:  brew install esteban-eg-kim/tap/hivemux && hivemux setup
# Update url + sha256 for each release:
#   curl -sL https://github.com/esteban-eg-kim/hivemux/archive/refs/tags/vX.Y.Z.tar.gz | shasum -a 256
class Hivemux < Formula
  desc "See and switch between every Claude Code session from one tmux sidebar"
  homepage "https://github.com/esteban-eg-kim/hivemux"
  url "https://github.com/esteban-eg-kim/hivemux/archive/refs/tags/v0.1.5.tar.gz"
  sha256 "885c77a5b479d2c9b6d5c1ddfff640b9f85f72375c74e76dcf84fcf8221b33e0"
  license "MIT"
  head "https://github.com/esteban-eg-kim/hivemux.git", branch: "main"

  depends_on "jq"
  depends_on :macos
  depends_on "tmux"

  def install
    libexec.install "bin", "share", "docs", "examples"
    # link every command (hivemux-panes list, hivemux-sidebar fix ... are used for troubleshooting)
    (libexec/"bin").children.each { |f| bin.install_symlink f }
  end

  def caveats
    <<~EOS
      Finish the setup (adds hivemux to ~/.tmux.conf, Ghostty and Claude Code hooks):
        hivemux setup
      Guide: #{opt_libexec}/docs/guide.html
    EOS
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/hivemux version")
  end
end
