# English Listening Player

A pure front-end local media player built with vanilla HTML, CSS, and JavaScript.
It plays audio and video files stored locally, displays synchronized LRC lyrics,
and uses IndexedDB to persist your library between sessions.

## Features

- Scan a local folder and import audio / video files
- Persist files in IndexedDB (survives page reloads)
- Auto-pair `.lrc` lyric files with same-named media files
- Three-line focused lyric display (previous / current / next)
- Click any lyric line to jump to that timestamp
- Toggle lyrics on and off
- Play both audio and video with a single player element
- Adjustable skip forward / backward interval
- Loop or sequential playback
- Minimalist light UI

## File Structure
/
├── index.html    # Markup
├── style.css     # Styles
├── script.js     # Logic
├── README.md
└── .gitignore

```

## Usage

1. Open `index.html` in a modern browser.
2. Click **＋ Folder** and select a directory containing your media files.
3. Files are saved to IndexedDB automatically.
4. Playback starts from the first track.

### Lyric pairing

Lyrics are matched by file name (extension removed, case-insensitive):

```

song.mp3
song.lrc      ← paired

```

## LRC Format

Standard LRC timestamps are supported:

```

[00:12.34]First line
[00:18.90]Second line

```

Millisecond precision (2 or 3 digits) is handled.

## Controls

| Button | Action |
|---|---|
| `‹‹` | Skip backward by the selected interval |
| `››` | Skip forward by the selected interval |
| `⏮` | Previous track |
| `▶ / ⏸` | Play / pause |
| `⏭` | Next track |
| `↻` | Toggle loop mode |
| `＋ Folder` | Select and import a folder |
| `✕ Clear` | Remove all saved media |
| `⟳ Reload` | Reload the library from IndexedDB |
| `💬 Lyrics` | Show / hide the lyric panel |

## Browser Support

Works in modern Chromium, Firefox, and Safari.
`webkitdirectory` (folder selection) requires a Chromium-based browser or Firefox.

## Notes

- All processing happens locally. No data is uploaded anywhere.
- Placeholder audio sources in the HTML can be removed if unused.
- Large media files are kept in IndexedDB, not in the repository.

## License

MIT