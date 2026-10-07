const menuToggle = document.getElementById('menuToggle');
        const menuPanel = document.getElementById('menuPanel');

        
        function toggleMenu() {
            menuPanel.classList.toggle('open');
        }

        function closeMenu() {
            menuPanel.classList.remove('open');
        }

        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });

       
        document.addEventListener('click', function(e) {
            const card = document.querySelector('.player-card');
            if (card && !card.contains(e.target)) {
                closeMenu();
            }
        });



const bar = document.getElementById("progressTrack");
const durationRest = document.getElementById("durationRest");

 const bigbutton = document.querySelectorAll(".giant-btn");
  const wardtime = document.getElementById("forwardSelect");
  const smPlayer = document.getElementById("smPlayer");
  const Progress = document.getElementById("progress");
  const currenTime = document.getElementById("current_time");
  const loopped = document.getElementById("loop");
  const playButton = document.getElementById("playbutton");

  const DB_NAME = 'MusicPlayerDB';
  const DB_VERSION = 2;
  const STORE_NAME = 'songs';

  let db = null;
  let songList = [
    { name: 'u.mp3', size: 3739821, lastModified: 1782016573633 }
];
  let currentIndex = -1;
  let isUserSeeking = false;
  let looped = false;

  
  let times = Number(wardtime.value);
  function forward(){
  console.log(times);
    smPlayer.currentTime += times;
  }

  function backward(){
    smPlayer.currentTime -=  times;
  }

 function loop(){
   looped = looped?false:true;
   loopped.value = looped?"Loop":"Order";
   return looped;
 } 

  function updateTime() {
    times =Number(wardtime.value);
  }
  
  function play(e) {
    if(smPlayer.paused) {
      playButton.textContent = "⏸";
      smPlayer.play();
    } else {
      playButton.textContent = "▶";
      smPlayer.pause();
    }
  }

  function progress() {
    Progress.style.width =`${smPlayer.currentTime*100/smPlayer.duration}%`;
    currenTime.innerHTML = sztime(smPlayer.currentTime);

    durationRest.innerHTML = smPlayer.duration?sztime(smPlayer.duration -smPlayer.currentTime):"00:00:00";
  }

  function sztime(s) {
   let m = Math.floor((s/60)%60);
    let h = Math.floor(s/3600);
    s = Math.floor(s%60);
    return (h<10?"0"+h:h) + ":" + (m<10?"0"+m:m) + ":" + (s<10?"0"+s:s);
  }
  
  
 
  let seeking = false;

  bar.addEventListener("pointerdown", (e) => {
    seeking = true;
    bar.setPointerCapture(e.pointerId);
    seekTo(e.clientX);
  })

  bar.addEventListener("pointermove", (e) => {
    if (seeking) seekTo(e.clientX);
  });

  bar.addEventListener("pointerup", () => {
    seeking = false;
  });

  function seekTo(clientX) {
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) /rect.width, 0) ,1);
    smPlayer.currentTime = ratio*smPlayer.duration;
  }
  


  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function(e) {
        const database = e.target.result;
        if(!database.objectStoreNames.contains(STORE_NAME)){
          const store = database.createObjectStore(STORE_NAME, {keyPath: 'name'});
          store.createIndex('size', 'size', {unique:false});
          store.createIndex('lastModified', 'lastModified', {unique:false});
          console.log('DATA BASE CREATED!!');
        }

        if (!database.objectStoreNames.contains('lyrics')) {
          database.createObjectStore('lyrics', {keyPath: 'name'});
        }
      };

      request.onsuccess = function(e) {
        db = e.target.result;
        console.log('DATABASE OPEN!');
        resolve(db);
      };

      request.onerror = function(e) {
        console.log('DATABASE OPEN ERROR!!');
        reject(e.target.error);
      };
    });
  }

  
  function saveSongsToDB(files) {
    return new Promise((resolve, reject) =>{
      if(!db) {
        reject(new Error('DATABASE NOT OPEN!'));
        return;
      }
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      let savedCount = 0;
      const total = files.length;

      files.forEach(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        const isMedia = file.type.startsWith('audio/') ||
                        file.type.startsWith('video/') ||
                        AUDIO_EXT.includes(ext) ||
                        VIDEO_EXT.includes(ext);
        if(!isMedia) return;
        const songData = {
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          type: file.type,
          file: file
        };

        const request = store.put(songData);
        request.onsuccess = function(){
          savedCount++;
          if(savedCount == total){
            resolve();
          }
        };

        request.onerror = function(e) {
          console.error('Save Failed:', file.name, e.target.error);
        };
      });

      transaction.oncomplete = function() {
        console.log(`SUCCESSFULLY SAVE ${savedCount} SONGS`);

      };

      transaction.onerror = function(e) {
        reject(e.target.error);
      };
    });
  }


  function loadAllSongsFromDB() {
    return new Promise((resolve, reject) => {
      if(!db) {
        reject(new Error('DATABASE NOT OPEN!'));
        return;
      }

      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = function(e) {
        const songs = e.target.result;
        console.log(songs);
        console.log(`Load ${songs.length} songs!`);
        resolve(songs);
      };
    });
  }

  
  function clearAllSongsFromDB() {
    return new Promise((resolve, reject) => {
      if(!db) {
        reject(new Error('DATABASE NOT OPEN'));
        return;
      }

      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess =function() {
        console.log('All songs deleted!');
        resolve();
      };

      request.onerror = function(e) {
        reject(e.target.error);
      };
    });
  }

  function saveLrcToDB(files) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB NOT OPEN'));
    const tx = db.transaction('lyrics', 'readwrite');
    const store = tx.objectStore('lyrics');
    files.forEach(file => {
      const base = file.name.replace(/\.[^.]+$/, '').toLowerCase();
      store.put({ name: base, file });
    });
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}

function loadAllLrcFromDB() {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB NOT OPEN'));
    const tx = db.transaction('lyrics', 'readonly');
    const req = tx.objectStore('lyrics').getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

function clearAllLrcFromDB() {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB NOT OPEN'));
    const tx = db.transaction('lyrics', 'readwrite');
    const req = tx.objectStore('lyrics').clear();
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  });
}

  function renderSongList(songs) {
    const list = document.getElementById('songList');
    const stats = document.getElementById('stats');
    if(!songs || songs.length === 0){
      list.innerHTML =`
        <div class="empty-state">
          <p>No Music Yet</p>
        </div>`;

    document.getElementById('playerSection').style.display = 'none';
    return;
    }
    document.getElementById('playerSection').style.display = 'block';

    let html = '';
    songs.forEach((song, index) => {
      const isActive = index===currentIndex?'active':'';
      html += `
        <div class="song-item ${isActive}" onclick="playSong(${index})">
          <span class="name">${song.name}</span>
        </div>`;
    });
    list.innerHTML = html;
  }

  async function playSong(index) {
    if(index<0||index>= songList.length) return;
    currentIndex = index;
    const song = songList[index];

    if(!song.file) {
      console.error('song not exist!');
      return;
    }

    if(smPlayer.src && smPlayer.src.startsWith('blob:')){
      URL.revokeObjectURL(smPlayer.src);
    }

    const url = URL.createObjectURL(song.file);
    smPlayer.src = url;
    smPlayer.load();

    const ext = song.name.split('.').pop().toLowerCase();
    const isVideo = (song.type && song.type.startsWith('video/')) ||
                    VIDEO_EXT.includes(ext);
    smPlayer.classList.toggle('show-video', isVideo);

    document.getElementById('nowPlaying').textContent = `${song.name}`;
    renderSongList(songList);

    await loadLyricsFor(song.name);

    smPlayer.play().catch(err => {
      console.log('autoplay stopped');
    });
  }

  async function loadLyricsFor(songName) {
    const base = songName.replace(/\.[^.]+$/, '').toLowerCase();
    const lrcFile = lrcMap[base];

    if(!lrcFile) {
      lyrics = [];
      renderLyrics();
      lyricsBox.textContent = 'No LYRIC';
      return;
    }
      const text = await lrcFile.text();
      lyrics = parseLRC(text);
      renderLyrics();
  }

  function playNext() {
    if(songList.length === 0)return;
    const nextIndex = (currentIndex + 1) % songList.length;
    playSong(nextIndex);
  }

  function playPrevious() {
    if(songList.length === 0) return;
    const prevIndex = (currentIndex -1 + songList.length)%songList.length;
    playSong(prevIndex);
  }

const AUDIO_EXT = ['mp3', 'flac', 'wav', 'm4a', 'ogg', 'aac', 'opus'];
const VIDEO_EXT = ['mp4', 'webm', 'mkv', 'mov', 'm4v'];

function filterAudio(files) {
  return files.filter(f => {
    const ext = f.name.split('.').pop().toLowerCase();
    return f.type.startsWith('audio/') || f.type.startsWith('video/')|| AUDIO_EXT.includes(ext)||VIDEO_EXT.includes(ext);
  });
}

function filterLrc(files) {
  return files.filter(f => f.name.toLowerCase().endsWith('.lrc'));
}


  function selectFolder() {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;


    input.onchange = async function(e) {
      const files = Array.from(e.target.files);
      const audioFiles = filterAudio(files);
      const lrcFiles = filterLrc(files);
      

      if(audioFiles.length === 0) {
        alert('Files not found');
        return;
      }

      const list = document.getElementById('songList');
      list.innerHTML = `
        <div class="loading">Saving ${audioFiles.length} songs...</div>`;

      try{
        await saveSongsToDB(audioFiles);
        await saveLrcToDB(lrcFiles);
        await reloadFromDB();

        if(songList.length > 0) playSong(0);
      }catch(error) {
        console.error('save failed:', error);
        alert('save failed: ' + error.message);
        await reloadFromDB();
  }
      };
      input.click();
    }


function parseLRC(text) {
  const lines = text.split('\n');
  const result = [];
  const timeTag = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

  for (const line of lines) {
    const times = [...line.matchAll(timeTag)];
    if (!times.length) continue;
    const content = line.replace(timeTag, '').trim();
    if(!content) continue;

    for (const t of times) {
      const min = parseInt(t[1], 10);
      const sec = parseInt(t[2], 10);
      const ms = t[3] ? parseInt(t[3].padEnd(3, '0'), 10) :0;
      result.push({time: min * 60 + sec + ms/1000, text: content });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

let lyricsVisible = true;

function toggleLyrics() {
    lyricsVisible = !lyricsVisible;
    lyricsBox.style.display = lyricsVisible? '' : 'none';
    document.getElementById('lyricsToggle').style.opacity = lyricsVisible? '1': '0.5';
}

let lyrics = [];

const lyricsBox = document.querySelector('#lyrics');
let currentIndexs = -1;

function renderLyrics() {
  lyricsBox.innerHTML = '';
  lyrics.forEach((l, i) => {
    const p = document.createElement('p');
    p.textContent = l.text;
    p.dataset.index = i;
    lyricsBox.appendChild(p);
  });
}

smPlayer.addEventListener('timeupdate', () => {
  const t = smPlayer.currentTime;

  let idx = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if(lyrics[i].time <= t) idx = i;
    else break;
  }
  if( idx !== currentIndexs) {
    currentIndexs = idx;
    highlightLine(idx);
  }
})


function highlightLine(idx) {
  const prev = lyricsBox.querySelector('.active');
  if (prev) prev.classList.remove('active');
  if(idx < 0 ) return;
  const el = lyricsBox.querySelector(`[data-index="${idx}"]`);
  if(!el) return;
  el.classList.add('active');
  el.scrollIntoView({behavior:'smooth', block: 'center'});
}

async function loadLyrics(url) {
  const res = await fetch(url);
  const text = await res.text();
  lyrics = parseLRC(text);
}

async function clearAllMusic(){
  if(!confirm('Clear all the Songs?'))
  return;

  try {
    await clearAllSongsFromDB();
    await clearAllLrcFromDB();
    lrcMap = {};
    songList =[];
    currentIndex=-1;
    smPlayer.src = '';
    lyrics = [];
    renderLyrics();

    document.getElementById('nowPlaying').textContent ='Not Playing';
    renderSongList([]);
    } catch(error){
      console.error('clear failed:', error);
      alert('clear failed' + error.message);
    }
}

let lrcMap = {};

async function reloadFromDB(){
  try{
    const songs = await loadAllSongsFromDB();
    if (songs && songs.length > 0) {
      songList = songs;
    }

    lrcMap = {}
    const lrcs = await loadAllLrcFromDB();
    for (const item of lrcs) {
      lrcMap[item.name] = item.file;
    }

    if(currentIndex >= songList.length) {
      currentIndex = -1;
      smPlayer.src = '';
      document.getElementById('nowPlaying').textContext ='Not Playing';
    }
    renderSongList(songList);
    return songs;
    } catch(error) {
      console.error('load failed', error);
      return [];
    }

}

lyricsBox.addEventListener('click', (e) => {
  const p = e.target.closest('p[data-index]');
  if(!p) return;
  const i = Number(p.dataset.index);
  smPlayer.currentTime = lyrics[i].time;
  smPlayer.play();
})

smPlayer.addEventListener('ended', 
  function(){
    if(!looped){
      playNext();
    } else {
      playSong(currentIndex);
    }
  });

wardtime.addEventListener("change", updateTime);

  window.addEventListener("load", 
    function() { 
      smPlayer.addEventListener("timeupdate", progress)});

  window.addEventListener("load", progress);

async function init() {
  try {
    await openDB();
    await reloadFromDB();
    console.log('init finished');
    } catch(error) {
    console.log('init failed');
    alert('init failed');
    }
}

init();