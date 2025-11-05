// YouTube Multi-Viewer Application
class YouTubeMultiViewer {
    constructor() {
        this.videos = [];
        this.currentGrid = '2x2';
        this.profiles = {};
        this.currentVideoFullscreen = null;
        this.defaultProfile = null;
        this.editingVideoId = null;
        this.iframeReadyStates = new Map(); // Track which iframes are ready
        this.isMuted = false; // Track mute state for toggle functionality
        
        this.initializeElements();
        this.bindEvents();
        this.loadProfiles();
        this.loadDefaultProfile();
        this.autoLoadDefaultProfile();
        this.updateGrid();
        this.setupYouTubeAPIListener();
    }

    // Initialize DOM elements
    initializeElements() {
        // Grid elements
        this.videoGrid = document.getElementById('videoGrid');
        this.gridSizeSelect = document.getElementById('gridSize');
        
        // Profile elements
        this.profileSelect = document.getElementById('profileSelect');
        this.profileNameInput = document.getElementById('profileName');
        this.saveProfileBtn = document.getElementById('saveProfile');
        this.loadProfileBtn = document.getElementById('loadProfile');
        this.deleteProfileBtn = document.getElementById('deleteProfile');
        this.setDefaultProfileBtn = document.getElementById('setDefaultProfile');
        
        // Control elements
        this.addVideosBtn = document.getElementById('addVideos');
        this.playAllBtn = document.getElementById('playAll');
        this.stopAllBtn = document.getElementById('stopAll');
        this.seekBackAllBtn = document.getElementById('seekBackAll');
        this.seekForwardAllBtn = document.getElementById('seekForwardAll');
        this.muteAllBtn = document.getElementById('muteAll');
        this.clearAllBtn = document.getElementById('clearAll');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        
        // Modal elements
        this.videoModal = document.getElementById('videoModal');
        this.videoUrlsTextarea = document.getElementById('videoUrls');
        this.confirmVideosBtn = document.getElementById('confirmVideos');
        this.cancelVideosBtn = document.getElementById('cancelVideos');
        this.modalClose = document.querySelector('.close');
        
        // Edit video modal elements
        this.editVideoModal = document.getElementById('editVideoModal');
        this.editVideoUrlInput = document.getElementById('editVideoUrl');
        this.confirmEditVideoBtn = document.getElementById('confirmEditVideo');
        this.cancelEditVideoBtn = document.getElementById('cancelEditVideo');
        this.editModalClose = this.editVideoModal.querySelector('.close');
        this.currentVideoTitleSpan = document.getElementById('currentVideoTitle');
        this.currentVideoUrlSpan = document.getElementById('currentVideoUrl');
        
        // Status elements
        this.videoCountSpan = document.getElementById('videoCount');
        this.gridInfoSpan = document.getElementById('gridInfo');
    }

    // Bind event listeners
    bindEvents() {
        // Grid controls
        this.gridSizeSelect.addEventListener('change', () => {
            this.currentGrid = this.gridSizeSelect.value;
            this.updateGrid();
        });

        // Video management
        this.addVideosBtn.addEventListener('click', () => this.showVideoModal());
        this.playAllBtn.addEventListener('click', () => this.playAllVideos());
        this.stopAllBtn.addEventListener('click', () => this.stopAllVideos());
        this.seekBackAllBtn.addEventListener('click', () => this.seekAllVideosBack());
        this.seekForwardAllBtn.addEventListener('click', () => this.seekAllVideosForward());
        this.muteAllBtn.addEventListener('click', () => this.muteAllVideos());
        this.clearAllBtn.addEventListener('click', () => this.clearAllVideos());
        
        // Profile management
        this.saveProfileBtn.addEventListener('click', () => this.saveCurrentProfile());
        this.loadProfileBtn.addEventListener('click', () => this.loadSelectedProfile());
        this.deleteProfileBtn.addEventListener('click', () => this.deleteSelectedProfile());
        this.setDefaultProfileBtn.addEventListener('click', () => this.toggleDefaultProfile());
        this.profileSelect.addEventListener('change', () => this.updateProfileButtons());
        
        // Modal controls
        this.confirmVideosBtn.addEventListener('click', () => this.addVideosFromModal());
        this.cancelVideosBtn.addEventListener('click', () => this.hideVideoModal());
        this.modalClose.addEventListener('click', () => this.hideVideoModal());
        
        // Edit video modal controls
        this.confirmEditVideoBtn.addEventListener('click', () => this.confirmEditVideo());
        this.cancelEditVideoBtn.addEventListener('click', () => this.hideEditVideoModal());
        this.editModalClose.addEventListener('click', () => this.hideEditVideoModal());
        
        // Fullscreen
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Modal backdrop click
        this.videoModal.addEventListener('click', (e) => {
            if (e.target === this.videoModal) {
                this.hideVideoModal();
            }
        });
        
        this.editVideoModal.addEventListener('click', (e) => {
            if (e.target === this.editVideoModal) {
                this.hideEditVideoModal();
            }
        });

        // Add escape key listener directly to the edit modal
        this.editVideoModal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.hideEditVideoModal();
            }
        });

        // Enter key support for edit input
        this.editVideoUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.confirmEditVideo();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.hideEditVideoModal();
            }
        });

        // Fullscreen change events
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());
    }

    // Setup YouTube iframe API message listener
    setupYouTubeAPIListener() {
        window.addEventListener('message', (event) => {
            // Debug: Log all messages from YouTube
            if (event.origin === 'https://www.youtube.com') {
                console.log('YouTube message received:', event.data);
            }
            
            if (event.origin !== 'https://www.youtube.com') return;
            
            try {
                const data = JSON.parse(event.data);
                console.log('Parsed YouTube data:', data);
                
                // Handle getCurrentTime response for seeking
                if (data.event === 'infoDelivery' && data.info && typeof data.info.currentTime === 'number') {
                    const iframe = Array.from(document.querySelectorAll('iframe')).find(
                        iframe => iframe.contentWindow === event.source
                    );
                    
                    if (iframe && iframe.dataset.seekDirection) {
                        const currentTime = data.info.currentTime;
                        const seekDirection = iframe.dataset.seekDirection;
                        const isIndividualSeek = iframe.dataset.individualSeek === 'true';
                        let newTime;
                        
                        if (seekDirection === 'back') {
                            newTime = Math.max(0, currentTime - 10);
                        } else if (seekDirection === 'forward') {
                            newTime = currentTime + 10;
                        }
                        
                        // Send seekTo command
                        const seekCommand = {
                            event: 'command',
                            func: 'seekTo',
                            args: [newTime, true]
                        };
                        
                        iframe.contentWindow.postMessage(JSON.stringify(seekCommand), 'https://www.youtube.com');
                        
                        // Show notification for individual seeks
                        if (isIndividualSeek) {
                            const videoId = iframe.id.replace('youtube-iframe-', '');
                            const direction = seekDirection === 'back' ? 'back' : 'forward';
                            const timeStr = this.formatTime(newTime);
                            this.showNotification(`Video ${direction} 10s → ${timeStr}`);
                            
                            // Show time overlay on the video
                            this.showVideoTimeOverlay(videoId, newTime);
                        }
                        
                        // Clear the seek direction and individual seek flag
                        delete iframe.dataset.seekDirection;
                        delete iframe.dataset.individualSeek;
                        
                        console.log(`Seeking ${seekDirection} to ${newTime}s from ${currentTime}s on ${isIndividualSeek ? 'individual' : 'all'} video(s)`);
                    }
                }
                
                // Track iframe readiness for various events
                if (data.event === 'video-progress' || data.event === 'onReady' || data.event === 'onStateChange') {
                    const iframe = Array.from(document.querySelectorAll('iframe')).find(
                        iframe => iframe.contentWindow === event.source
                    );
                    if (iframe) {
                        console.log('Marking iframe as ready:', iframe.id);
                        this.iframeReadyStates.set(iframe, true);
                    }
                }
            } catch (e) {
                // Log non-JSON messages for debugging
                console.log('Non-JSON message from YouTube:', event.data);
            }
        });
        
        console.log('YouTube API message listener setup complete');
    }

    // Utility Functions
    extractVideoId(url) {
        // More comprehensive patterns to handle various YouTube URL formats
        const patterns = [
            // Standard watch URLs: youtube.com/watch?v=VIDEO_ID
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:[&?].*)?/,
            // Short URLs: youtu.be/VIDEO_ID
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?].*)?/,
            // Embed URLs: youtube.com/embed/VIDEO_ID
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[?].*)?/,
            // Old format: youtube.com/v/VIDEO_ID
            /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})(?:[?].*)?/,
            // Mobile URLs: m.youtube.com/watch?v=VIDEO_ID
            /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:[&?].*)?/,
            // Gaming URLs: gaming.youtube.com/watch?v=VIDEO_ID
            /(?:gaming\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:[&?].*)?/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    validateYouTubeUrl(url) {
        return this.extractVideoId(url) !== null;
    }

    getGridDimensions(gridSize) {
        const [cols, rows] = gridSize.split('x').map(Number);
        return { cols, rows, total: cols * rows };
    }

    getOptimalEmbedUrl(videoInfo) {
        if (typeof videoInfo === 'string') {
            // Backward compatibility - assume YouTube
            const origin = encodeURIComponent(window.location.origin);
            return `https://www.youtube.com/embed/${videoInfo}?enablejsapi=1&origin=${origin}&autoplay=0&controls=1&rel=0&enablejsapi=1`;
        }
        
        // Default to YouTube with JavaScript API enabled for Play/Stop functionality
        const origin = encodeURIComponent(window.location.origin);
        return `https://www.youtube.com/embed/${videoInfo.id}?enablejsapi=1&origin=${origin}&autoplay=0&controls=1&rel=0&enablejsapi=1`;
    }

    // Video Management
    showVideoModal() {
        this.videoModal.style.display = 'block';
        this.videoUrlsTextarea.focus();
    }

    hideVideoModal() {
        this.videoModal.style.display = 'none';
        this.videoUrlsTextarea.value = '';
    }

    addVideosFromModal() {
        const urls = this.videoUrlsTextarea.value
            .split('\n')
            .map(url => url.trim())
            .filter(url => url && this.validateYouTubeUrl(url));

        if (urls.length === 0) {
            alert('Please enter valid YouTube URLs');
            return;
        }

        const { total } = this.getGridDimensions(this.currentGrid);
        const availableSlots = total - this.videos.length;

        if (urls.length > availableSlots) {
            const proceed = confirm(
                `You can only add ${availableSlots} more videos to the current grid. ` +
                `Do you want to add the first ${availableSlots} videos?`
            );
            if (!proceed) return;
            urls.splice(availableSlots);
        }

        urls.forEach(url => {
            const videoId = this.extractVideoId(url);
            if (videoId && !this.videos.find(v => v.id === videoId)) {
                this.videos.push({
                    id: videoId,
                    url: url,
                    title: `Video ${this.videos.length + 1}`
                });
            }
        });

        this.updateGrid();
        this.hideVideoModal();
    }

    removeVideo(videoId) {
        this.videos = this.videos.filter(video => video.id !== videoId);
        this.updateGrid();
    }

    clearAllVideos() {
        if (this.videos.length === 0) return;
        
        if (confirm('Are you sure you want to clear all videos?')) {
            this.videos = [];
            this.updateGrid();
        }
    }

    // Play all videos
    playAllVideos() {
        const iframes = this.videoGrid.querySelectorAll('iframe');
        let commandsSent = 0;
        let attemptsCount = 0;
        
        iframes.forEach((iframe, index) => {
            // Check if it's a YouTube iframe
            if (iframe.src && iframe.src.includes('youtube.com/embed')) {
                attemptsCount++;
                
                const sendPlayCommand = () => {
                    try {
                        // Multiple command formats to ensure compatibility
                        const commands = [
                            '{"event":"command","func":"playVideo","args":""}',
                            JSON.stringify({"event":"command","func":"playVideo","args":[]}),
                            JSON.stringify({"event":"command","func":"playVideo"})
                        ];
                        
                        commands.forEach(command => {
                            iframe.contentWindow.postMessage(command, 'https://www.youtube.com');
                        });
                        
                        // Also try the direct API call
                        iframe.contentWindow.postMessage('{"event":"listening"}', 'https://www.youtube.com');
                        
                        commandsSent++;
                    } catch (error) {
                        console.warn('Failed to send play command to iframe:', error);
                    }
                };

                // Try sending immediately and with delays
                sendPlayCommand();
                setTimeout(sendPlayCommand, 500);
                setTimeout(sendPlayCommand, 1000);
            }
        });
        
        if (attemptsCount > 0) {
            this.showNotification(`Attempting to play ${attemptsCount} YouTube video(s)...`);
            console.log(`Play commands sent to ${commandsSent} iframe(s)`);
        } else {
            this.showNotification('No YouTube videos found to play');
        }
    }

    // Stop/pause all videos
    stopAllVideos() {
        const iframes = this.videoGrid.querySelectorAll('iframe');
        let commandsSent = 0;
        let attemptsCount = 0;
        
        iframes.forEach((iframe, index) => {
            // Check if it's a YouTube iframe
            if (iframe.src && iframe.src.includes('youtube.com/embed')) {
                attemptsCount++;
                
                const sendPauseCommand = () => {
                    try {
                        // Multiple command formats to ensure compatibility
                        const commands = [
                            '{"event":"command","func":"pauseVideo","args":""}',
                            JSON.stringify({"event":"command","func":"pauseVideo","args":[]}),
                            JSON.stringify({"event":"command","func":"pauseVideo"})
                        ];
                        
                        commands.forEach(command => {
                            iframe.contentWindow.postMessage(command, 'https://www.youtube.com');
                        });
                        
                        commandsSent++;
                    } catch (error) {
                        console.warn('Failed to send pause command to iframe:', error);
                    }
                };

                // Try sending immediately and with delays
                sendPauseCommand();
                setTimeout(sendPauseCommand, 500);
                setTimeout(sendPauseCommand, 1000);
            }
        });
        
        if (attemptsCount > 0) {
            this.showNotification(`Attempting to pause ${attemptsCount} YouTube video(s)...`);
            console.log(`Pause commands sent to ${commandsSent} iframe(s)`);
        } else {
            this.showNotification('No YouTube videos found to pause');
        }
    }

    // Toggle mute/unmute all videos
    muteAllVideos() {
        const iframes = this.videoGrid.querySelectorAll('iframe');
        let commandsSent = 0;
        let attemptsCount = 0;
        
        // Toggle mute state
        this.isMuted = !this.isMuted;
        const command = this.isMuted ? 'mute' : 'unMute';
        const action = this.isMuted ? 'mute' : 'unmute';
        
        iframes.forEach((iframe, index) => {
            // Check if it's a YouTube iframe
            if (iframe.src && iframe.src.includes('youtube.com/embed')) {
                attemptsCount++;
                
                const sendMuteCommand = () => {
                    try {
                        // Multiple command formats to ensure compatibility
                        const commands = [
                            `{"event":"command","func":"${command}","args":""}`,
                            JSON.stringify({"event":"command","func":command,"args":[]}),
                            JSON.stringify({"event":"command","func":command})
                        ];
                        
                        commands.forEach(cmd => {
                            iframe.contentWindow.postMessage(cmd, 'https://www.youtube.com');
                        });
                        
                        commandsSent++;
                    } catch (error) {
                        console.warn(`Failed to send ${action} command to iframe:`, error);
                    }
                };

                // Try sending immediately and with delays
                sendMuteCommand();
                setTimeout(sendMuteCommand, 500);
                setTimeout(sendMuteCommand, 1000);
            }
        });
        
        // Update button appearance
        this.updateMuteButtonAppearance();
        
        if (attemptsCount > 0) {
            this.showNotification(`Attempting to ${action} ${attemptsCount} YouTube video(s)...`);
            console.log(`${action} commands sent to ${commandsSent} iframe(s)`);
        } else {
            this.showNotification('No YouTube videos found to ' + action);
        }
    }

    // Update mute button appearance
    updateMuteButtonAppearance() {
        if (this.muteAllBtn) {
            const icon = this.muteAllBtn.querySelector('i');
            if (this.isMuted) {
                icon.className = 'fas fa-volume-up';
                this.muteAllBtn.innerHTML = '<i class="fas fa-volume-up"></i> Unmute All';
                this.muteAllBtn.title = 'Unmute all YouTube videos';
            } else {
                icon.className = 'fas fa-volume-mute';
                this.muteAllBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Mute All';
                this.muteAllBtn.title = 'Mute all YouTube videos';
            }
        }
    }

    // Seek all videos backward by 10 seconds
    seekAllVideosBack() {
        const iframes = this.videoGrid.querySelectorAll('iframe');
        let commandsSent = 0;
        let attemptsCount = 0;
        
        iframes.forEach((iframe, index) => {
            // Check if it's a YouTube iframe
            if (iframe.src && iframe.src.includes('youtube.com/embed')) {
                attemptsCount++;
                
                const sendSeekBackCommand = () => {
                    try {
                        // Send getCurrentTime request first, then seek back
                        const getCurrentTimeCommand = {
                            event: 'command',
                            func: 'getCurrentTime',
                            args: []
                        };
                        
                        // Store iframe reference for the response
                        iframe.dataset.seekDirection = 'back';
                        
                        iframe.contentWindow.postMessage(JSON.stringify(getCurrentTimeCommand), 'https://www.youtube.com');
                        
                        commandsSent++;
                    } catch (error) {
                        console.warn('Failed to send seek back command to iframe:', error);
                    }
                };

                // Try sending immediately and with delays
                sendSeekBackCommand();
                setTimeout(sendSeekBackCommand, 500);
            }
        });
        
        if (attemptsCount > 0) {
            this.showNotification(`Seeking back 10 seconds on ${attemptsCount} YouTube video(s)...`);
            console.log(`Seek back commands sent to ${commandsSent} iframe(s)`);
        } else {
            this.showNotification('No YouTube videos found to seek');
        }
    }

    // Seek all videos forward by 10 seconds
    seekAllVideosForward() {
        const iframes = this.videoGrid.querySelectorAll('iframe');
        let commandsSent = 0;
        let attemptsCount = 0;
        
        iframes.forEach((iframe, index) => {
            // Check if it's a YouTube iframe
            if (iframe.src && iframe.src.includes('youtube.com/embed')) {
                attemptsCount++;
                
                const sendSeekForwardCommand = () => {
                    try {
                        // Send getCurrentTime request first, then seek forward
                        const getCurrentTimeCommand = {
                            event: 'command',
                            func: 'getCurrentTime',
                            args: []
                        };
                        
                        // Store iframe reference for the response
                        iframe.dataset.seekDirection = 'forward';
                        
                        iframe.contentWindow.postMessage(JSON.stringify(getCurrentTimeCommand), 'https://www.youtube.com');
                        
                        commandsSent++;
                    } catch (error) {
                        console.warn('Failed to send seek forward command to iframe:', error);
                    }
                };

                // Try sending immediately and with delays
                sendSeekForwardCommand();
                setTimeout(sendSeekForwardCommand, 500);
            }
        });
        
        if (attemptsCount > 0) {
            this.showNotification(`Seeking forward 10 seconds on ${attemptsCount} YouTube video(s)...`);
            console.log(`Seek forward commands sent to ${commandsSent} iframe(s)`);
        } else {
            this.showNotification('No YouTube videos found to seek');
        }
    }

    // Edit video URL functionality
    editVideoUrl(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (!video) return;
        
        this.editingVideoId = videoId;
        
        // Set current video info
        this.currentVideoTitleSpan.textContent = video.title;
        this.currentVideoUrlSpan.textContent = video.url || `https://www.youtube.com/watch?v=${videoId}`;
        
        // Set current URL in input
        this.editVideoUrlInput.value = video.url || `https://www.youtube.com/watch?v=${videoId}`;
        
        // Show modal
        this.showEditVideoModal();
    }

    showEditVideoModal() {
        this.editVideoModal.style.display = 'block';
        
        // Ensure modal can receive keyboard events
        this.editVideoModal.tabIndex = -1;
        
        // Focus the input and select its content
        setTimeout(() => {
            this.editVideoUrlInput.focus();
            this.editVideoUrlInput.select();
        }, 100);
    }

    hideEditVideoModal() {
        this.editVideoModal.style.display = 'none';
        this.editVideoUrlInput.value = '';
        this.editingVideoId = null;
    }

    confirmEditVideo() {
        const newUrl = this.editVideoUrlInput.value.trim();
        
        if (!newUrl) {
            alert('Please enter a YouTube URL');
            return;
        }
        
        if (!this.validateYouTubeUrl(newUrl)) {
            alert('Please enter a valid YouTube URL');
            this.editVideoUrlInput.focus();
            return;
        }
        
        const newVideoId = this.extractVideoId(newUrl);
        if (!newVideoId) {
            alert('Could not extract video ID from URL');
            return;
        }
        
        // Check if this video ID already exists (and it's not the same video we're editing)
        const existingVideo = this.videos.find(v => v.id === newVideoId && v.id !== this.editingVideoId);
        if (existingVideo) {
            alert('This video is already in the grid');
            return;
        }
        
        // Update the video
        const videoIndex = this.videos.findIndex(v => v.id === this.editingVideoId);
        if (videoIndex !== -1) {
            this.videos[videoIndex] = {
                id: newVideoId,
                url: newUrl,
                title: `Video ${videoIndex + 1}`
            };
            
            this.updateGrid();
            this.hideEditVideoModal();
            this.showNotification('Video URL updated successfully!');
        }
    }

    // Copy video URL functionality
    copyVideoUrl(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (!video) return;
        
        const url = video.url || `https://www.youtube.com/watch?v=${videoId}`;
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('Video URL copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy URL:', err);
                this.fallbackCopyText(url);
            });
        } else {
            this.fallbackCopyText(url);
        }
    }

    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showNotification('Video URL copied to clipboard!');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showNotification('Failed to copy URL');
        }
        
        textArea.remove();
    }

    // Individual video seek functionality
    seekVideoBack(videoId) {
        const iframe = document.getElementById(`youtube-iframe-${videoId}`);
        if (!iframe || !iframe.src.includes('youtube.com/embed')) {
            console.warn('YouTube iframe not found for video:', videoId);
            return;
        }

        try {
            // Send getCurrentTime request first
            const getCurrentTimeCommand = {
                event: 'command',
                func: 'getCurrentTime',
                args: []
            };
            
            // Store seek direction for this specific iframe
            iframe.dataset.seekDirection = 'back';
            iframe.dataset.individualSeek = 'true';
            
            iframe.contentWindow.postMessage(JSON.stringify(getCurrentTimeCommand), 'https://www.youtube.com');
            
            console.log(`Seeking back 10s on video: ${videoId}`);
        } catch (error) {
            console.warn('Failed to seek back on video:', videoId, error);
        }
    }

    seekVideoForward(videoId) {
        const iframe = document.getElementById(`youtube-iframe-${videoId}`);
        if (!iframe || !iframe.src.includes('youtube.com/embed')) {
            console.warn('YouTube iframe not found for video:', videoId);
            return;
        }

        try {
            // Send getCurrentTime request first
            const getCurrentTimeCommand = {
                event: 'command',
                func: 'getCurrentTime',
                args: []
            };
            
            // Store seek direction for this specific iframe
            iframe.dataset.seekDirection = 'forward';
            iframe.dataset.individualSeek = 'true';
            
            iframe.contentWindow.postMessage(JSON.stringify(getCurrentTimeCommand), 'https://www.youtube.com');
            
            console.log(`Seeking forward 10s on video: ${videoId}`);
        } catch (error) {
            console.warn('Failed to seek forward on video:', videoId, error);
        }
    }

    // Grid Management
    updateGrid() {
        const { cols, rows, total } = this.getGridDimensions(this.currentGrid);
        
        // Update CSS class
        this.videoGrid.className = `video-grid grid-${this.currentGrid}`;
        
        // Clear existing content
        this.videoGrid.innerHTML = '';

        if (this.videos.length === 0) {
            this.showEmptyState();
        } else {
            this.renderVideos(total);
        }

        this.updateStatus();
    }

    showEmptyState() {
        const placeholder = document.createElement('div');
        placeholder.className = 'grid-placeholder';
        placeholder.innerHTML = `
            <i class="fab fa-youtube"></i>
            <div>No videos loaded</div>
            <div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">
                Click "Add Videos" to get started
            </div>
        `;
        this.videoGrid.appendChild(placeholder);
    }

    renderVideos(maxSlots) {
        const videosToShow = this.videos.slice(0, maxSlots);
        
        videosToShow.forEach((video, index) => {
            const container = this.createVideoContainer(video, index);
            this.videoGrid.appendChild(container);
        });

        // Fill empty slots
        const emptySlots = maxSlots - videosToShow.length;
        for (let i = 0; i < emptySlots; i++) {
            const emptyContainer = this.createEmptySlot(videosToShow.length + i);
            this.videoGrid.appendChild(emptyContainer);
        }
    }

    createVideoContainer(video, index) {
        const container = document.createElement('div');
        container.className = 'video-container';
        
        // Create video info object for embed URL generation
        const videoInfo = {
            type: video.type || 'youtube',
            id: video.id,
            originalUrl: video.url
        };
        
        const embedUrl = this.getOptimalEmbedUrl(videoInfo);
        
        container.innerHTML = `
            <iframe
                id="youtube-iframe-${video.id}"
                src="${embedUrl}"
                title="${video.title}"
                frameborder="0"
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
            </iframe>
            <div class="video-controls">
                <button class="video-control-btn seek-btn" onclick="app.seekVideoBack('${video.id}')" title="Seek back 10s">
                    <i class="fas fa-backward"></i>
                </button>
                <button class="video-control-btn seek-btn" onclick="app.seekVideoForward('${video.id}')" title="Seek forward 10s">
                    <i class="fas fa-forward"></i>
                </button>
                <button class="video-control-btn" onclick="app.editVideoUrl('${video.id}')" title="Edit URL">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="video-control-btn" onclick="app.copyVideoUrl('${video.id}')" title="Copy URL">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="video-control-btn" onclick="app.toggleVideoFullscreen('${video.id}')" title="Fullscreen">
                    <i class="fas fa-expand"></i>
                </button>
                <button class="video-control-btn" onclick="app.removeVideo('${video.id}')" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        return container;
    }

    createEmptySlot(index) {
        const container = document.createElement('div');
        container.className = 'video-container';
        container.style.background = 'rgba(255, 255, 255, 0.1)';
        container.style.border = '2px dashed rgba(255, 255, 255, 0.3)';
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255, 255, 255, 0.5); font-size: 0.9rem;">
                <i class="fas fa-plus" style="margin-right: 0.5rem;"></i>
                Empty Slot ${index + 1}
            </div>
        `;
        return container;
    }

    // Profile Management
    loadProfiles() {
        try {
            const saved = localStorage.getItem('youtube-multiviewer-profiles');
            this.profiles = saved ? JSON.parse(saved) : {};
            this.updateProfileSelect();
        } catch (error) {
            console.error('Error loading profiles:', error);
            this.profiles = {};
        }
    }

    saveProfiles() {
        try {
            localStorage.setItem('youtube-multiviewer-profiles', JSON.stringify(this.profiles));
        } catch (error) {
            console.error('Error saving profiles:', error);
            alert('Error saving profiles. Storage might be full.');
        }
    }

    updateProfileSelect() {
        const currentSelection = this.profileSelect.value;
        this.profileSelect.innerHTML = '<option value="">Select Profile</option>';
        
        Object.keys(this.profiles).sort().forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            
            // Add indicator for default profile
            if (this.defaultProfile === name) {
                option.textContent = `⭐ ${name} (Default)`;
            } else {
                option.textContent = name;
            }
            
            this.profileSelect.appendChild(option);
        });
        
        // Restore selection if it still exists
        if (this.profiles[currentSelection]) {
            this.profileSelect.value = currentSelection;
        }
        
        this.updateProfileButtons();
    }

    updateProfileButtons() {
        const hasSelection = this.profileSelect.value !== '';
        const selectedProfile = this.profileSelect.value;
        
        this.loadProfileBtn.disabled = !hasSelection;
        this.deleteProfileBtn.disabled = !hasSelection;
        this.setDefaultProfileBtn.disabled = !hasSelection;
        
        // Update default profile button appearance
        const isDefault = this.defaultProfile === selectedProfile;
        this.setDefaultProfileBtn.classList.toggle('is-default', isDefault);
        
        if (isDefault) {
            this.setDefaultProfileBtn.innerHTML = '<i class="fas fa-star"></i> Unset Default';
            this.setDefaultProfileBtn.title = 'Remove as default profile';
        } else {
            this.setDefaultProfileBtn.innerHTML = '<i class="fas fa-star"></i> Set Default';
            this.setDefaultProfileBtn.title = 'Set as default profile (auto-loads on refresh)';
        }
    }

    saveCurrentProfile() {
        const name = this.profileNameInput.value.trim();
        
        if (!name) {
            alert('Please enter a profile name');
            this.profileNameInput.focus();
            return;
        }

        if (this.profiles[name]) {
            if (!confirm(`Profile "${name}" already exists. Overwrite it?`)) {
                return;
            }
        }

        this.profiles[name] = {
            videos: [...this.videos],
            gridSize: this.currentGrid,
            savedAt: new Date().toISOString()
        };

        this.saveProfiles();
        this.updateProfileSelect();
        this.profileSelect.value = name;
        this.profileNameInput.value = '';
        this.updateProfileButtons();

        this.showNotification(`Profile "${name}" saved successfully!`);
    }

    loadSelectedProfile() {
        const name = this.profileSelect.value;
        if (!name || !this.profiles[name]) return;

        const profile = this.profiles[name];
        
        if (this.videos.length > 0) {
            if (!confirm('Loading this profile will replace current videos. Continue?')) {
                return;
            }
        }

        this.videos = [...profile.videos];
        this.currentGrid = profile.gridSize;
        this.gridSizeSelect.value = this.currentGrid;
        
        this.updateGrid();
        this.showNotification(`Profile "${name}" loaded successfully!`);
    }

    deleteSelectedProfile() {
        const name = this.profileSelect.value;
        if (!name || !this.profiles[name]) return;

        if (confirm(`Are you sure you want to delete profile "${name}"?`)) {
            // If this is the default profile, unset it
            if (this.defaultProfile === name) {
                this.defaultProfile = null;
                this.saveDefaultProfile();
            }
            
            delete this.profiles[name];
            this.saveProfiles();
            this.updateProfileSelect();
            this.showNotification(`Profile "${name}" deleted successfully!`);
        }
    }

    toggleDefaultProfile() {
        const selectedProfile = this.profileSelect.value;
        if (!selectedProfile || !this.profiles[selectedProfile]) return;

        if (this.defaultProfile === selectedProfile) {
            // Unset as default
            this.defaultProfile = null;
            this.showNotification(`"${selectedProfile}" is no longer the default profile`);
        } else {
            // Set as default
            this.defaultProfile = selectedProfile;
            this.showNotification(`"${selectedProfile}" is now the default profile (will auto-load on refresh)`);
        }
        
        this.saveDefaultProfile();
        this.updateProfileButtons();
    }

    loadDefaultProfile() {
        try {
            const saved = localStorage.getItem('youtube-multiviewer-default-profile');
            this.defaultProfile = saved || null;
        } catch (error) {
            console.error('Error loading default profile:', error);
            this.defaultProfile = null;
        }
    }

    saveDefaultProfile() {
        try {
            if (this.defaultProfile) {
                localStorage.setItem('youtube-multiviewer-default-profile', this.defaultProfile);
            } else {
                localStorage.removeItem('youtube-multiviewer-default-profile');
            }
        } catch (error) {
            console.error('Error saving default profile:', error);
        }
    }

    autoLoadDefaultProfile() {
        if (this.defaultProfile && this.profiles[this.defaultProfile]) {
            // Only auto-load if we don't already have videos loaded
            if (this.videos.length === 0) {
                const profile = this.profiles[this.defaultProfile];
                this.videos = [...profile.videos];
                this.currentGrid = profile.gridSize;
                this.gridSizeSelect.value = this.currentGrid;
                this.profileSelect.value = this.defaultProfile;
                this.updateProfileButtons();
                
                console.log(`Auto-loaded default profile: "${this.defaultProfile}"`);
            }
        }
    }

    // Fullscreen Management
    toggleFullscreen() {
        if (this.isFullscreen()) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    enterFullscreen() {
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    isFullscreen() {
        return !!(document.fullscreenElement || 
                 document.webkitFullscreenElement || 
                 document.mozFullScreenElement || 
                 document.msFullscreenElement);
    }

    handleFullscreenChange() {
        const fullscreen = this.isFullscreen();
        document.documentElement.classList.toggle('fullscreen-mode', fullscreen);
        document.body.classList.toggle('fullscreen-mode', fullscreen);
        
        // Hide/show UI elements in fullscreen
        const header = document.querySelector('.header');
        const statusBar = document.querySelector('.status-bar');
        const videoControls = document.querySelectorAll('.video-controls');
        
        if (fullscreen) {
            // Force hide everything in fullscreen
            header.style.display = 'none';
            statusBar.style.display = 'none';
            videoControls.forEach(control => control.style.display = 'none');
            
        } else {
            header.style.display = 'block';
            statusBar.style.display = 'block';
            videoControls.forEach(control => control.style.display = 'flex');
            
            // If we were in single video fullscreen mode, exit it
            if (this.currentVideoFullscreen) {
                this.exitVideoFullscreen();
            }
        }
        
        // Update button icon if button exists
        if (this.fullscreenBtn) {
            const icon = this.fullscreenBtn.querySelector('i');
            if (fullscreen) {
                icon.className = 'fas fa-compress';
                this.fullscreenBtn.title = 'Exit Fullscreen';
            } else {
                icon.className = 'fas fa-expand';
                this.fullscreenBtn.title = 'Enter Fullscreen';
            }
        }
    }

    toggleVideoFullscreen(videoId) {
        const container = document.querySelector(`iframe[src*="${videoId}"]`)?.parentElement;
        if (!container) return;

        // Check if we're already in video fullscreen mode
        if (this.currentVideoFullscreen === videoId) {
            this.exitFullscreen();
        } else {
            this.enterVideoFullscreen(container, videoId);
        }
    }

    enterVideoFullscreen(container, videoId) {
        // Store which video is going fullscreen
        this.currentVideoFullscreen = videoId;
        
        // Hide all other videos and show only this one
        this.videoGrid.querySelectorAll('.video-container').forEach(videoContainer => {
            const iframe = videoContainer.querySelector('iframe');
            const currentVideoId = iframe ? this.extractVideoIdFromSrc(iframe.src) : null;
            
            if (currentVideoId === videoId) {
                videoContainer.classList.add('single-video-fullscreen');
            } else {
                videoContainer.style.display = 'none';
            }
        });
        
        // Enter browser fullscreen
        this.enterFullscreen();
    }

    exitVideoFullscreen() {
        // Reset video display
        this.videoGrid.querySelectorAll('.video-container').forEach(videoContainer => {
            videoContainer.classList.remove('single-video-fullscreen');
            videoContainer.style.display = '';
        });
        
        // Clear the current video fullscreen
        this.currentVideoFullscreen = null;
    }

    extractVideoIdFromSrc(src) {
        const match = src.match(/\/embed\/([^?&]+)/);
        return match ? match[1] : null;
    }

    // Keyboard Shortcuts
    handleKeyboard(event) {
        // Don't interfere with input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.key) {
            case 'f':
            case 'F':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.toggleFullscreen();
                }
                break;
            case 'a':
            case 'A':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.showVideoModal();
                }
                break;
            case 'p':
            case 'P':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.playAllVideos();
                }
                break;
            case 's':
            case 'S':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.stopAllVideos();
                }
                break;
            case 'm':
            case 'M':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.muteAllVideos();
                }
                break;
            case 'c':
            case 'C':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.clearAllVideos();
                }
                break;
            case 'ArrowLeft':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.seekAllVideosBack();
                }
                break;
            case 'ArrowRight':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.seekAllVideosForward();
                }
                break;
            case 'Escape':
                if (this.videoModal.style.display === 'block') {
                    this.hideVideoModal();
                } else if (this.editVideoModal.style.display === 'block') {
                    this.hideEditVideoModal();
                } else if (this.isFullscreen()) {
                    // Exit fullscreen (this will handle both grid and single video)
                    this.exitFullscreen();
                }
                break;
        }
    }

    // Helper method to format time in MM:SS format
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Show time overlay on specific video
    showVideoTimeOverlay(videoId, currentTime) {
        const videoContainer = document.querySelector(`#youtube-iframe-${videoId}`).parentElement;
        if (!videoContainer) return;

        // Remove existing overlay if present
        const existingOverlay = videoContainer.querySelector('.time-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create time overlay
        const timeOverlay = document.createElement('div');
        timeOverlay.className = 'time-overlay';
        timeOverlay.textContent = this.formatTime(currentTime);
        
        videoContainer.appendChild(timeOverlay);

        // Auto-hide after 2 seconds
        setTimeout(() => {
            if (timeOverlay && timeOverlay.parentElement) {
                timeOverlay.style.opacity = '0';
                setTimeout(() => {
                    if (timeOverlay && timeOverlay.parentElement) {
                        timeOverlay.remove();
                    }
                }, 300);
            }
        }, 2000);
    }

    // Status Updates
    updateStatus() {
        const { total } = this.getGridDimensions(this.currentGrid);
        this.videoCountSpan.textContent = `${this.videos.length} / ${total} videos loaded`;
        this.gridInfoSpan.textContent = `Grid: ${this.currentGrid}`;
    }

    // Notifications
    showNotification(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .fullscreen-mode .video-grid {
        height: 100vh !important;
    }
`;
document.head.appendChild(style);

// Initialize the application
const app = new YouTubeMultiViewer();

// Make it available globally for inline event handlers
window.app = app;