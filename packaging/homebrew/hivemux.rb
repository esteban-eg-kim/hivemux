# Homebrew formula. Put this in a tap repository named esteban-eg-kim/homebrew-tap
# (Formula/hivemux.rb), then:  brew install esteban-eg-kim/tap/hivemux && hivemux setup
# Update url + sha256 for each release:
#   curl -sL https://github.com/esteban-eg-kim/hivemux/archive/refs/tags/vX.Y.Z.tar.gz | shasum -a 256
class Hivemux < Formula
  desc "See and switch between every Claude Code session from one tmux sidebar"
  homepage "https://hivemux.dev"
  url "https://github.com/esteban-eg-kim/hivemux/archive/refs/tags/v0.1.59.tar.gz"
  sha256 "3b893cca857ae7cebbe0a81791b1f0cacb204d0dbbb6e96db8ec410bd3cf2de2"
  license "MIT"
  head "https://github.com/esteban-eg-kim/hivemux.git", branch: "main"

  depends_on "jq"
  depends_on :macos
  depends_on "tmux"

  def install
    libexec.install "bin", "share", "examples"
    # link every command (hivemux-panes list, hivemux-sidebar fix ... are used for troubleshooting)
    (libexec/"bin").children.each { |f| bin.install_symlink f if f.extname != ".py" }
  end

  def caveats
    <<~EOS
      Finish the setup (adds hivemux to ~/.tmux.conf, Ghostty and Claude Code hooks):
        hivemux setup
      Guide: https://hivemux.dev/docs/
    EOS
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/hivemux version")
  end
end
