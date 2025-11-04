# YouTube Multi-Viewer

A modern web application that allows you to watch multiple YouTube videos simultaneously in a customizable grid layout. Perfect for monitoring multiple streams, comparing content, or creating video walls.

## 🚀 Features

### ✨ Core Features
- **Multi-Video Grid**: Display 1-16 YouTube videos simultaneously
- **Flexible Layouts**: Choose from 1×1, 1×2, 2×1, 2×2, 2×3, 3×2, 3×3, and 4×4 grid layouts
- **Profile Management**: Save, load, edit, and delete video layout profiles
- **Fullscreen Support**: Toggle fullscreen for the entire grid or individual videos
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### 🎛️ Controls & Interface
- **Drag & Drop**: Easy video management with intuitive controls
- **Keyboard Shortcuts**: Quick access to common functions
- **Modern UI**: Clean, professional interface with smooth animations
- **Real-time Status**: Live updates showing video count and grid information

### 💾 Profile System
- **Save Layouts**: Store your favorite video combinations
- **Quick Loading**: Instantly switch between saved profiles  
- **Profile Management**: Edit names, delete unwanted profiles
- **Persistent Storage**: Profiles saved locally in your browser

## 🔧 How to Use

### Getting Started
1. Open `index.html` in your web browser
2. Click "Add Videos" to start adding YouTube URLs
3. Paste YouTube links (one per line) in the modal
4. Choose your preferred grid layout
5. Enjoy your multi-video experience!

### Adding Videos
- Click the **"Add Videos"** button
- Enter YouTube URLs in any of these formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`
- The app automatically validates URLs and extracts video IDs

### Profile Management
1. **Save Profile**: 
   - Arrange your videos and grid layout
   - Enter a profile name
   - Click "Save"

2. **Load Profile**:
   - Select a profile from the dropdown
   - Click "Load"

3. **Delete Profile**:
   - Select the profile to delete
   - Click "Delete" and confirm

### Grid Layouts
- **1×1**: Single video (fullscreen-like)
- **1×2**: Two videos stacked vertically  
- **2×1**: Two videos side by side
- **2×2**: Four videos in a square (default)
- **2×3**: Six videos in 2 columns, 3 rows
- **3×2**: Six videos in 3 columns, 2 rows
- **3×3**: Nine videos in a square
- **4×4**: Sixteen videos for maximum monitoring

### Fullscreen Modes
- **Grid Fullscreen**: Click the fullscreen button to expand the entire grid
- **Individual Video**: Hover over a video and click the expand icon
- **Exit**: Press `Escape` or click the compress button

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + F` | Toggle grid fullscreen |
| `Ctrl/Cmd + A` | Open add videos modal |
| `Ctrl/Cmd + C` | Clear all videos |
| `Escape` | Close modals / Exit fullscreen |

## 📱 Mobile Support

The application is fully responsive and works on:
- **Desktop**: Full feature set with mouse interactions
- **Tablet**: Touch-optimized interface with gesture support
- **Mobile**: Streamlined layout for smaller screens

## 🛠️ Technical Features

### Performance
- **Efficient Rendering**: Only loads videos that fit in the current grid
- **Memory Management**: Automatic cleanup of unused video elements
- **Smooth Animations**: CSS transitions for professional feel

### Browser Compatibility  
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **HTML5 Features**: Uses modern web standards
- **Responsive**: Works across all device sizes

### Local Storage
- **Persistent Profiles**: Saves profiles in browser localStorage
- **No Server Required**: Fully client-side application
- **Privacy Focused**: No data sent to external servers

## 🎨 Customization

The application uses CSS custom properties and modular code, making it easy to customize:

### Styling
- Edit `styles.css` to change colors, fonts, and layouts
- Modify CSS variables for quick theme changes
- Add custom grid layouts by extending the CSS grid classes

### Functionality
- Extend `script.js` to add new features
- Add custom keyboard shortcuts
- Integrate with other APIs or services

## 📋 File Structure

```
pg_yt/
├── index.html          # Main application file
├── styles.css          # Stylesheet with responsive design
├── script.js           # Application logic and functionality
└── README.md          # This documentation
```

## 🔒 Privacy & Security

- **No Data Collection**: The app doesn't collect or store personal data
- **Local Storage Only**: All profiles saved in your browser
- **YouTube Embed**: Uses YouTube's official embed API
- **Secure**: No external dependencies or third-party tracking

## 🚀 Quick Start Example

1. Open the application
2. Click "Add Videos"
3. Paste these example URLs:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   https://www.youtube.com/watch?v=jNQXAC9IVRw
   https://www.youtube.com/watch?v=L_jWHffIx5E
   https://www.youtube.com/watch?v=fC7oUOUEEi4
   ```
4. Select "2×2" grid layout
5. Save as "Demo Profile"
6. Toggle fullscreen and enjoy!

## 💡 Tips & Best Practices

- **Start Small**: Begin with a 2×2 grid and expand as needed
- **Save Frequently**: Create profiles for different use cases
- **Use Fullscreen**: Maximize screen real estate for better viewing
- **Check URLs**: Ensure YouTube links are valid before adding
- **Mobile Friendly**: The app works great on tablets for portable monitoring

## 🐛 Troubleshooting

### Videos Not Loading
- Check if YouTube URLs are valid
- Ensure you have an internet connection
- Some videos may have embed restrictions

### Performance Issues
- Reduce grid size for better performance
- Close other browser tabs using video
- Clear browser cache if needed

### Profile Issues
- Check if localStorage is enabled in your browser
- Profiles are browser-specific and don't sync across devices

Enjoy your YouTube Multi-Viewer experience! 🎉