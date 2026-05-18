import AppKit
import CoreGraphics
import Foundation

enum CursorRole: String, CaseIterable {
    case arrow = "Arrow"
    case text = "Text"
    case link = "Link"
    case wait = "Wait"
    case move = "Move"
    case resizeNS = "ResizeNS"
    case resizeEW = "ResizeEW"
    case resizeDiag1 = "ResizeDiag1"
    case resizeDiag2 = "ResizeDiag2"
    case forbidden = "Forbidden"
    case help = "Help"
}

struct CursorConfig {
    var theme = "Regular"
    var role: CursorRole = .arrow
    var repositoryRoot: URL
    var hideNativeCursor = true
    var animationFPS = 12.0
    var pollFPS = 120.0
    var cursorScale = 1.0
    var durationSeconds: Double?
    var cycleSeconds: Double?
    var enableHotkeys = true
    var verbose = false

    static func parse() -> CursorConfig {
        let cwd = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
        var config = CursorConfig(repositoryRoot: cwd.deletingLastPathComponent())
        var args = Array(CommandLine.arguments.dropFirst())

        func takeValue(after flag: String) -> String? {
            guard let index = args.firstIndex(of: flag), index + 1 < args.count else { return nil }
            let value = args[index + 1]
            args.remove(at: index + 1)
            args.remove(at: index)
            return value
        }

        if args.contains("--help") || args.contains("-h") {
            print("""
            Usage:
              swift run bluearchive-cursor-overlay [options]

            Options:
              --repo PATH          Repository root. Defaults to parent of NativeCursorOverlay.
              --theme NAME         Regular or Millennium. Default: Regular.
              --role ROLE          Arrow, Text, Link, Wait, Move, ResizeNS, ResizeEW, ResizeDiag1, ResizeDiag2, Forbidden, Help.
              --scale NUMBER       Overlay scale multiplier. Default: 1.0.
              --animation-fps N    Animated cursor FPS. Default: 12.
              --poll-fps N         Mouse polling FPS fallback. Default: 120.
              --duration N         Exit automatically after N seconds.
              --cycle-seconds N    Automatically cycle roles every N seconds.
              --no-hide            Do not hide the native cursor.
              --no-hotkeys         Disable global role switching hotkeys.
              --verbose            Print diagnostics.

            Quit with Control-C from the terminal.
            """)
            exit(0)
        }

        if let repo = takeValue(after: "--repo") {
            config.repositoryRoot = URL(fileURLWithPath: repo).standardizedFileURL
        }
        if let theme = takeValue(after: "--theme") {
            config.theme = theme
        }
        if let roleName = takeValue(after: "--role") {
            guard let role = CursorRole(rawValue: roleName) else {
                fatalError("Unknown role \(roleName). Valid roles: \(CursorRole.allCases.map(\.rawValue).joined(separator: ", "))")
            }
            config.role = role
        }
        if let scale = takeValue(after: "--scale"), let value = Double(scale), value > 0 {
            config.cursorScale = value
        }
        if let fps = takeValue(after: "--animation-fps"), let value = Double(fps), value > 0 {
            config.animationFPS = value
        }
        if let fps = takeValue(after: "--poll-fps"), let value = Double(fps), value > 0 {
            config.pollFPS = value
        }
        if let duration = takeValue(after: "--duration"), let value = Double(duration), value > 0 {
            config.durationSeconds = value
        }
        if let cycle = takeValue(after: "--cycle-seconds"), let value = Double(cycle), value > 0 {
            config.cycleSeconds = value
        }
        if args.contains("--no-hide") {
            config.hideNativeCursor = false
            args.removeAll { $0 == "--no-hide" }
        }
        if args.contains("--no-hotkeys") {
            config.enableHotkeys = false
            args.removeAll { $0 == "--no-hotkeys" }
        }
        if args.contains("--verbose") {
            config.verbose = true
            args.removeAll { $0 == "--verbose" }
        }
        if !args.isEmpty {
            fatalError("Unknown arguments: \(args.joined(separator: " "))")
        }
        return config
    }
}

struct CursorFrame {
    let image: NSImage
    let hotspot: CGPoint
    let logicalSize: CGSize
}

final class CursorAssetLoader {
    private let config: CursorConfig
    private let hotspots: [String: Any]

    init(config: CursorConfig) {
        self.config = config
        let hotspotURL = config.repositoryRoot.appendingPathComponent("docs/hotspots.json")
        guard
            let data = try? Data(contentsOf: hotspotURL),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            fatalError("Could not read \(hotspotURL.path)")
        }
        self.hotspots = json
    }

    func loadFrames(for role: CursorRole? = nil) -> [CursorFrame] {
        let role = role ?? config.role
        let frameDirectory = config.repositoryRoot
            .appendingPathComponent("generated_frames")
            .appendingPathComponent(config.theme)
            .appendingPathComponent(role.rawValue)
        let staticFrameDirectory = config.repositoryRoot
            .appendingPathComponent("generated_frames_static")
            .appendingPathComponent(config.theme)
            .appendingPathComponent(role.rawValue)

        let directory = FileManager.default.fileExists(atPath: frameDirectory.path)
            ? frameDirectory
            : staticFrameDirectory
        let fileNames = ((try? FileManager.default.contentsOfDirectory(atPath: directory.path)) ?? [])
            .filter { $0.hasSuffix(".png") && !$0.contains("@2x") }
            .sorted()
        guard !fileNames.isEmpty else {
            fatalError("No frames found in \(directory.path)")
        }

        let metadata = hotspotMetadata(for: role)
        return fileNames.compactMap { name in
            let url = directory.appendingPathComponent(name)
            guard let image = NSImage(contentsOf: url) else { return nil }
            image.isTemplate = false
            return CursorFrame(
                image: image,
                hotspot: CGPoint(x: metadata.hotspotX, y: metadata.hotspotY),
                logicalSize: CGSize(width: metadata.pointsWide, height: metadata.pointsHigh)
            )
        }
    }

    private func hotspotMetadata(for role: CursorRole) -> (hotspotX: Double, hotspotY: Double, pointsWide: Double, pointsHigh: Double) {
        guard
            let themeDict = hotspots[config.theme] as? [String: Any],
            let roleDict = themeDict[role.rawValue] as? [String: Any],
            let hotspotX = roleDict["hotspotX"] as? Double,
            let hotspotY = roleDict["hotspotY"] as? Double,
            let pointsWide = roleDict["pointsWide"] as? Double,
            let pointsHigh = roleDict["pointsHigh"] as? Double
        else {
            fatalError("Missing hotspot metadata for \(config.theme)/\(role.rawValue)")
        }
        return (hotspotX, hotspotY, pointsWide, pointsHigh)
    }
}

final class CursorOverlayWindow: NSPanel {
    init() {
        let frame = NSScreen.screens.reduce(NSRect.null) { partial, screen in
            partial.union(screen.frame)
        }
        super.init(
            contentRect: frame,
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        backgroundColor = .clear
        isOpaque = false
        hasShadow = false
        ignoresMouseEvents = true
        collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary, .ignoresCycle]
        level = NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.maximumWindow)))
        orderFrontRegardless()
    }

    override var canBecomeKey: Bool { false }
    override var canBecomeMain: Bool { false }
}

final class CursorOverlayView: NSView {
    var frames: [CursorFrame] = []
    var currentFrameIndex = 0
    var mouseLocation = NSEvent.mouseLocation
    var globalOrigin = CGPoint.zero
    var scale = 1.0

    override var isFlipped: Bool { false }

    override func draw(_ dirtyRect: NSRect) {
        guard !frames.isEmpty else { return }
        let frame = frames[currentFrameIndex % frames.count]
        let size = CGSize(
            width: frame.logicalSize.width * scale,
            height: frame.logicalSize.height * scale
        )
        let localMouseLocation = CGPoint(
            x: mouseLocation.x - globalOrigin.x,
            y: mouseLocation.y - globalOrigin.y
        )
        let origin = CGPoint(
            x: localMouseLocation.x - frame.hotspot.x * scale,
            y: localMouseLocation.y - size.height + frame.hotspot.y * scale
        )
        frame.image.draw(
            in: CGRect(origin: origin, size: size),
            from: .zero,
            operation: .sourceOver,
            fraction: 1.0,
            respectFlipped: false,
            hints: [.interpolation: NSImageInterpolation.none]
        )
    }
}

@MainActor
final class CursorOverlayApp: NSObject, NSApplicationDelegate {
    private let config = CursorConfig.parse()
    private var window: CursorOverlayWindow?
    private var overlayView: CursorOverlayView?
    private var animationTimer: Timer?
    private var pollTimer: Timer?
    private var cycleTimer: Timer?
    private var eventTap: CFMachPort?
    private var nativeCursorHidden = false
    private lazy var assetLoader = CursorAssetLoader(config: config)
    private var frameCache: [CursorRole: [CursorFrame]] = [:]
    private var selectedRole: CursorRole?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        let frames = frames(for: config.role)
        let window = CursorOverlayWindow()
        let view = CursorOverlayView(frame: window.contentView?.bounds ?? NSRect(origin: .zero, size: window.frame.size))
        view.autoresizingMask = [.width, .height]
        view.frames = frames
        view.scale = config.cursorScale
        view.globalOrigin = window.frame.origin
        window.contentView = view
        self.window = window
        self.overlayView = view

        if config.hideNativeCursor {
            CGDisplayHideCursor(CGMainDisplayID())
            nativeCursorHidden = true
        }

        installEventTap()
        installPollingFallback()
        installAnimationTimer(frameCount: frames.count)
        installCycleTimer()

        if config.verbose {
            log("Blue Archive cursor overlay started")
            log("Theme: \(config.theme), role: \(config.role.rawValue), frames: \(frames.count)")
            log("Repo: \(config.repositoryRoot.path)")
            log("Window frame: \(window.frame)")
            log("Native cursor hidden: \(nativeCursorHidden)")
            log("Event tap installed: \(eventTap != nil)")
            if config.enableHotkeys {
                log("Hotkeys: Ctrl+Option+Cmd plus A/T/L/W/M/N/E/1/2/F/H")
            }
        }

        if let duration = config.durationSeconds {
            Timer.scheduledTimer(withTimeInterval: duration, repeats: false) { _ in
                DispatchQueue.main.async {
                    NSApp.terminate(nil)
                }
            }
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        if nativeCursorHidden {
            CGDisplayShowCursor(CGMainDisplayID())
        }
        if let eventTap {
            CFMachPortInvalidate(eventTap)
        }
    }

    private func installEventTap() {
        var mask = (1 << CGEventType.mouseMoved.rawValue)
            | (1 << CGEventType.leftMouseDragged.rawValue)
            | (1 << CGEventType.rightMouseDragged.rawValue)
            | (1 << CGEventType.otherMouseDragged.rawValue)
        if config.enableHotkeys {
            mask |= (1 << CGEventType.keyDown.rawValue)
        }
        let callback: CGEventTapCallBack = { proxy, type, event, refcon in
            guard let refcon else { return Unmanaged.passUnretained(event) }
            let app = Unmanaged<CursorOverlayApp>.fromOpaque(refcon).takeUnretainedValue()
            let location = event.location
            let flags = event.flags
            let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
            DispatchQueue.main.async {
                app.handleEvent(type: type, location: location, flags: flags, keyCode: keyCode)
            }
            return Unmanaged.passUnretained(event)
        }
        eventTap = CGEvent.tapCreate(
            tap: .cgSessionEventTap,
            place: .headInsertEventTap,
            options: .listenOnly,
            eventsOfInterest: CGEventMask(mask),
            callback: callback,
            userInfo: Unmanaged.passUnretained(self).toOpaque()
        )
        guard let eventTap else { return }
        let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, eventTap, 0)
        CFRunLoopAddSource(CFRunLoopGetMain(), source, .commonModes)
        CGEvent.tapEnable(tap: eventTap, enable: true)
    }

    private func installPollingFallback() {
        pollTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / config.pollFPS, repeats: true) { [weak self] _ in
            let location = NSEvent.mouseLocation
            DispatchQueue.main.async {
                self?.updateMouseLocation(location)
            }
        }
        RunLoop.main.add(pollTimer!, forMode: .common)
    }

    private func installAnimationTimer(frameCount: Int) {
        animationTimer?.invalidate()
        guard frameCount > 1 else { return }
        animationTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / config.animationFPS, repeats: true) { [weak self] _ in
            DispatchQueue.main.async {
                guard let view = self?.overlayView else { return }
                view.currentFrameIndex = (view.currentFrameIndex + 1) % frameCount
                view.needsDisplay = true
            }
        }
        RunLoop.main.add(animationTimer!, forMode: .common)
    }

    private func installCycleTimer() {
        guard let cycleSeconds = config.cycleSeconds else { return }
        let roles = CursorRole.allCases
        cycleTimer = Timer.scheduledTimer(withTimeInterval: cycleSeconds, repeats: true) { [weak self] _ in
            DispatchQueue.main.async {
                guard let self, let current = self.selectedRole ?? Optional(self.config.role),
                      let index = roles.firstIndex(of: current)
                else { return }
                self.switchRole(roles[(index + 1) % roles.count])
            }
        }
        RunLoop.main.add(cycleTimer!, forMode: .common)
    }

    private func updateMouseLocation(_ point: CGPoint) {
        guard let view = overlayView else { return }
        if view.mouseLocation != point {
            view.mouseLocation = point
            view.needsDisplay = true
        }
    }

    private func handleEvent(type: CGEventType, location: CGPoint, flags: CGEventFlags, keyCode: Int64) {
        switch type {
        case .mouseMoved, .leftMouseDragged, .rightMouseDragged, .otherMouseDragged:
            updateMouseLocation(location)
        case .keyDown:
            handleHotkey(flags: flags, keyCode: keyCode)
        default:
            break
        }
    }

    private func handleHotkey(flags: CGEventFlags, keyCode: Int64) {
        guard flags.contains(.maskControl), flags.contains(.maskAlternate), flags.contains(.maskCommand) else {
            return
        }
        let role: CursorRole?
        switch keyCode {
        case 0: role = .arrow       // A
        case 17: role = .text       // T
        case 37: role = .link       // L
        case 13: role = .wait       // W
        case 46: role = .move       // M
        case 45: role = .resizeNS   // N
        case 14: role = .resizeEW   // E
        case 18: role = .resizeDiag1 // 1
        case 19: role = .resizeDiag2 // 2
        case 3: role = .forbidden   // F
        case 4: role = .help        // H
        default: role = nil
        }
        if let role {
            switchRole(role)
        }
    }

    private func switchRole(_ role: CursorRole) {
        guard let view = overlayView else { return }
        let frames = frames(for: role)
        view.frames = frames
        view.currentFrameIndex = 0
        view.needsDisplay = true
        selectedRole = role
        installAnimationTimer(frameCount: frames.count)
        if config.verbose {
            log("Switched role: \(role.rawValue), frames: \(frames.count)")
        }
    }

    private func frames(for role: CursorRole) -> [CursorFrame] {
        if let cached = frameCache[role] {
            return cached
        }
        let loaded = assetLoader.loadFrames(for: role)
        frameCache[role] = loaded
        return loaded
    }

    private func log(_ message: String) {
        FileHandle.standardOutput.write((message + "\n").data(using: .utf8)!)
    }
}

let app = NSApplication.shared
let delegate = CursorOverlayApp()
app.delegate = delegate
app.run()
