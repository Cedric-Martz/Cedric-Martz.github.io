
class AssetManager {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.music = {};
        this.loadedImages = new Set();
        this.loadedSounds = new Set();
        this.loadedMusic = new Set();
    }

    loadImage(key, src) {
        if (this.loadedImages.has(key)) return Promise.resolve(this.images[key]);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.images[key] = img;
                this.loadedImages.add(key);
                console.log(`  Image loaded: ${key}`);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`  Failed to load image: ${key} (${src})`);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }

    loadImages(imageMap) {
        const promises = Object.entries(imageMap).map(([key, src]) =>
            this.loadImage(key, src)
        );
        return Promise.all(promises);
    }


    getImage(key) {
        if (!this.images[key]) {
            console.warn(`Image not found: ${key}`);
            return null;
        }
        return this.images[key];
    }

    isImageLoaded(key) {
        return this.loadedImages.has(key);
    }

    loadSound(key, src) {
        if (this.loadedSounds.has(key)) return Promise.resolve(this.sounds[key]);

        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';
            audio.oncanplaythrough = () => {
                this.sounds[key] = audio;
                this.loadedSounds.add(key);
                console.log(`  Sound loaded: ${key}`);
                resolve(audio);
            };
            audio.onerror = () => {
                console.warn(`  Failed to load sound: ${key} (${src})`);
                reject(new Error(`Failed to load sound: ${src}`));
            };
            audio.src = src;
            audio.load();
        });
    }

    loadSounds(soundMap) {
        const promises = Object.entries(soundMap).map(([key, src]) =>
            this.loadSound(key, src)
        );
        return Promise.all(promises);
    }

    playSound(key, volume = 1) {
        const audio = this.sounds[key];
        if (!audio) {
            console.warn(`Sound not found: ${key}`);
            return;
        }

        try {
            const clone = audio.cloneNode();
            clone.volume = Math.min(1, volume);
            clone.play().catch(err => console.warn(`Failed to play sound: ${key}`, err));
        } catch (err) {
            console.warn(`Error playing sound: ${key}`, err);
        }
    }

    isSoundLoaded(key) {
        return this.loadedSounds.has(key);
    }

    loadMusic(key, src) {
        if (this.loadedMusic.has(key)) return Promise.resolve(this.music[key]);

        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';
            audio.loop = true;
            audio.oncanplaythrough = () => {
                this.music[key] = audio;
                this.loadedMusic.add(key);
                console.log(`  Music loaded: ${key}`);
                resolve(audio);
            };
            audio.onerror = () => {
                console.warn(`  Failed to load music: ${key} (${src})`);
                reject(new Error(`Failed to load music: ${src}`));
            };
            audio.src = src;
            audio.load();
        });
    }

    loadMusics(musicMap) {
        const promises = Object.entries(musicMap).map(([key, src]) =>
            this.loadMusic(key, src)
        );
        return Promise.all(promises);
    }

    playMusic(key, volume = 0.5) {
        this.stopAllMusic();

        const audio = this.music[key];
        if (!audio) {
            console.warn(`Music not found: ${key}`);
            return;
        }

        try {
            audio.volume = Math.min(1, volume);
            audio.currentTime = 0;
            audio.play().catch(err => console.warn(`Failed to play music: ${key}`, err));
        } catch (err) {
            console.warn(`Error playing music: ${key}`, err);
        }
    }

    stopMusic(key = null) {
        if (key) {
            const audio = this.music[key];
            if (audio) audio.pause();
        } else {
            this.stopAllMusic();
        }
    }

    stopAllMusic() {
        Object.values(this.music).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    setMusicVolume(key, volume) {
        const audio = this.music[key];
        if (audio) audio.volume = Math.min(1, Math.max(0, volume));
    }

    isMusicLoaded(key) {
        return this.loadedMusic.has(key);
    }

    getStats() {
        return {
            imagesLoaded: this.loadedImages.size,
            soundsLoaded: this.loadedSounds.size,
            musicLoaded: this.loadedMusic.size,
            total: this.loadedImages.size + this.loadedSounds.size + this.loadedMusic.size
        };
    }

    logStats() {
        const stats = this.getStats();
        console.log('stats, you stinky nerd:');
        console.log(`Images: ${stats.imagesLoaded}`);
        console.log(`Sounds: ${stats.soundsLoaded}`);
        console.log(`Music: ${stats.musicLoaded}`);
        console.log(`Total: ${stats.total}`);
    }
}

const assetManager = new AssetManager();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AssetManager, assetManager };
}
