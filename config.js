/* ============================================================
   CONFIG – edit file ini untuk menambah / mengganti pilihan avatar
   ------------------------------------------------------------
   Cara tambah pilihan baru:
   1. Taruh file .svg di folder assets/svg/
   2. Tambahkan 1 baris di `parts` kategori yang sesuai:
      {name:'Nama Tombol', file:'NamaFile.svg', x:..., y:...}
      x,y = posisi pojok kiri-atas SVG di kanvas (lihat assets/referensi_Wajah_Full.svg).
      scale (opsional) = perbesar/perkecil, z (opsional) = urutan tumpukan.
      characterScale = skala semua bagian karakter di dalam kanvas.
      backFirst = letakkan path pertama di belakang; backPaths = indeks path
      (mulai dari 0) yang diletakkan di belakang.
   3. `map` = warna asli di file SVG -> warna yang dikontrol pengguna.
      'self' = warna yang dipilih pengguna di kategori itu
      'self*0.78' = lebih gelap, 'self+0.35' = lebih terang
      'kulit*0.86' = diambil dari warna kategori lain (mis. hidung ikut warna kulit)
      Warna yang tidak ditulis di `map` tidak berubah (mis. putih mata).
      `colorOnUserChoice:true` mempertahankan warna asli SVG sampai pengguna memilih warna.
      Background solid dapat ditambahkan sebagai bagian `{name:'Warna solid', solid:true}`;
      warnanya mengikuti nilai kategori dan dapat diubah lewat pemilih warna.
      Palet mendukung warna solid (#HEX) dan gradasi linear:
      {type:'linear', name:'Biru ke Ungu', colors:['#6EE7FF','#9B7BFF']}.
   Tombol "Tanpa" = tulis null di parts.
   ============================================================ */
const CONFIG = {
  canvas: { w: 740, h: 740 },   // ukuran kanvas avatar
  characterScale: 0.9,          // skala karakter di dalam kanvas
  printWidthMm: 40,             // lebar cetak saat tombol "Cetak" di admin ditekan
  categories: [
    
    // buat rambut bagian depan
    { k:'rambut depan', t:'Poni', color:'#E8E29F', z:80, crop:'0 0 694 470', default:1,
      palette:['#1A0F0A',
          '#4A2C1A', '#675345', '#8B5A2B', '#BFAE86', '#CCAD8E', '#C9A227', '#E8E29F',
          '#D9534F', '#7FBCD4', '#B37BEC', '#F4A6C8',
          '#E6E6E6', '#853D25', '#765A4B', '#393939',
          '#C81A00', '#FF7DCD'],
      map:{'#1A0F0A':'self*0.78','#4A2C1A':'self*0.78','#8B5A2B':'self','#C9A227':'self',
           '#E8E29F':'self','#B5AE5F':'self*0.78','#D9534F':'self','#7FBCD4':'self',
           '#478BA5':'self*0.78','#B37BEC':'self','#F4A6C8':'self','#E6E6E6':'self',
           '#96441B':'self','#4F230C':'self*0.78','#7B0000':'self','#500000':'self*0.78',
           '#250606':'self','#8B1818':'self*0.78',
           '#6D4E20':'self','#34250F':'self*0.78','#C81A00':'self',
           '#393939':'self*0.78','#2C2C2C':'self','#FF7DCD':'self','#D73C9B':'self*0.78',
           '#765A4B':'self*0.78','#E4A684':'self','#853D25':'self','#1F0E09':'self*0.78',
           '#D11900':'self','#450A0A':'self*0.78'},
      parts:[ null,
        {name:'',    file:'Poni Pendek Depan.svg',   x:48.589, y:75,},  // path pertama = rambut belakang
        {name:'', file:'Poni Panjang Depan.svg', x:80, y:77, z:120,},
        // backpath 1234 buat ngurutin darimana sing paling belakang
        {name:'', file:'Poni Twintail Depan.svg', x:80, y:80,},
        //  backPaths:[0,1,2,3,4]
        {name:'', file:'Rambut Biasa.svg', x:60, y:7,},
        {name:'', file:'Rambut Merah.svg', x:75, y:65,},
        {name:'', file:'Rambut Cina.svg', x:75, y:45,},
        {name:'', file:'Rambut Pink.svg', x:80, y:75,},
        {name:'', file:'Rambut Simetris.svg', x:37, y:-10,},
        {name:'', file:'Rambut Tutup Mata.svg', x:47, y:3,},
        {name:'', file:'Rambut Lemes.svg', x:30, y:-15, scale:0.7, color:'#675345',
          map:{'#675345':'self','#544236':'self*0.78','#A78A71':'self+0.25'}},
        {name:'', file:'Rambut Spiky.svg', x:10, y:-35, scale:0.72, color:'#BFAE86',
          map:{'#BFAE86':'self','#908064':'self*0.78','#807159':'self*0.7','#756855':'self*0.65'}},
        {name:'', file:'Rambut Tebel.svg', x:10, y:-35, scale:0.75, color:'#CCAD8E',
          map:{'#CCAD8E':'self','#A78A71':'self*0.78','#FAEAC4':'self+0.2'}},
        
      ] },
      
      // buat rambut bagian belakang
      { k:'rambut belakang', t:'Rambut', color:'#E8E29F', z:-15, crop:'0 0 694 470', default:0,
        palette:['#1A0F0A',
          '#4A2C1A',
          '#675345',
          '#8B5A2B',
          '#BFAE86',
          '#CCAD8E',
          '#C9A227',
          '#E8E29F',
          '#D9534F',
          '#7FBCD4',
          '#B37BEC',
          '#F4A6C8',
          '#E6E6E6',
          '#853D25',
          '#765A4B',
          '#393939',
          '#C81A00',
          '#FF7DCD',
        ],
        map:{'#1A0F0A':'self*0.78','#4A2C1A':'self*0.78','#8B5A2B':'self','#C9A227':'self',
           '#E8E29F':'self','#B5AE5F':'self*0.78','#D9534F':'self','#7FBCD4':'self',
           '#478BA5':'self*0.78','#B37BEC':'self','#F4A6C8':'self','#E6E6E6':'self',
           '#96441B':'self','#4F230C':'self*0.78','#7B0000':'self','#500000':'self*0.78',
           '#250606':'self','#8B1818':'self*0.78',
           '#6D4E20':'self','#34250F':'self*0.78','#C81A00':'self',
           '#393939':'self*0.78','#2C2C2C':'self','#FF7DCD':'self','#D73C9B':'self*0.78',
           '#765A4B':'self*0.78','#E4A684':'self','#853D25':'self','#1F0E09':'self*0.78',
           '#D11900':'self','#450A0A':'self*0.78'},
          parts:[ null,
            {name:'',    file:'Rambut Cowo Pendek Belakang.svg',   x:48.589, y:0,},  // path pertama = rambut belakang
            {name:'', file:'Rambut Cewe Panjang Belakang.svg', x:45, y:15, },
            // backpath 1234 buat ngurutin darimana sing paling belakang
            {name:'', file:'Rambut Twintail Belakang.svg', x:5, y:15},
            {name:'', file:'Rambut Sehelai.svg', x:296, y:15,},
            {name:'', file:'Rambut Belakang Merah.svg', x:55, y:-10,},
            {name:'', file:'Rambut Belakang Cina.svg', x:-52, y:-45,
              map:{'#2C2C2C':'self*0.78','#000000':'self*0.62'}},
            {name:'', file:'Rambut Belakang Pink.svg', x:-40, y:-10,},
            {name:'', file:'Rambut Belakang Lemes.svg', x:20, y:-20, scale: 0.7, color:'#675345',
              map:{'#675345':'self','#544236':'self*0.78','#A78A71':'self+0.25'}},
            {name:'', file:'Rambut Belakang Tebel.svg', x:5, y:-20, scale: 0.75, color:'#CCAD8E',
              map:{'#CCAD8E':'self','#A78A71':'self*0.78','#FAEAC4':'self+0.2'}},
      ] },

    { k:'kulit', t:'Wajah', color:'#FCD5B5', z:10, default:0,
      // palette:['#FFE4CC','#FCD5B5','#F1C27D','#E0A370','#C68642','#8D5524','#5C3A21'],
      // map:{'#FCD5B5':'self','#F2C5A0':'self*0.96','#CB9B75':'self*0.78'},
      parts:[ 
        {name:'', file:'new wajah 1.svg', x:0, y:100, color:'#FFD5B3'},
        {name:'', file:'new wajah 2.svg', x:0, y:100, color:'#FCD5B5'},
        {name:'', file:'new wajah 3.svg', x:0, y:100, color:'#F1CBAC'},
        {name:'', file:'new wajah 4.svg', x:0, y:100, color:'#E6AF83'},
        {name:'', file:'new wajah 5.svg', x:0, y:100, color:'#A56837'},
        {name:'', file:'new wajah 6.svg', x:0, y:100, color:'#68F761'},
        {name:'', file:'new wajah 7.svg', x:0, y:100, color:'#61B9F7'},
        {name:'', file:'new wajah 8.svg', x:0, y:100, color:'#FF9FDA'},
        {name:'', file:'new wajah 9.svg', x:0, y:100, color:'#FF8082'},
        {name:'', file:'new wajah 10.svg', x:0, y:100, color:'#D3D3D3'},
        {name:'', file:'new wajah 11.svg', x:0, y:100, color:'#515151'},
        {name:'', file:'new wajah 12.svg', x:0, y:100, color:'#FFF374'},
      ]
    },

    { k:'alis', t:'Alis', color:'#1A0505', z:100, crop:'60 190 570 190', default:1,
      palette:['#1A0505','#4A2C1A','#8B5A2B','#E8E29F','#222222','#7B5EA7'],
      map:{'#1A0505':'self'},
      parts:[ null,
        {name:'', file:'Alis adep atas.svg',   x:140, y:216.359},
        {name:'', file:'Alis adep bawah.svg', x:100, y:215},
        {name:'', file:'Alis bawah pendek.svg', x:154, y:230},
        {name:'', file:'Alis naik panjang.svg', x:154, y:205},
        {name:'', file:'Alis naik pendek.svg', x:175, y:220},
        {name:'', file:'Alis sangar kepotong kotak.svg', x:137, y:240},
        {name:'', file:'Alis sangar kepotong tajem.svg', x:155, y:240},
        {name:'', file:'Alis titik atas.svg', x:190, y:210},
        {name:'', file:'Alis titik bawah.svg', x:237, y:235},
        {name:'', file:'Alis Ga Simetris.svg', x:125, y:195, scale:0.9},
        {name:'', file:'Alis Tipis.svg', x:153, y:215, scale:0.7},
      ] },

    { k:'mata', t:'Mata', color:'#803737', z:20, crop:'60 230 570 250', default:1,
      palette:['#803737','#3B2A20','#485BB9','#2E8B57','#6B4FBB','#222222','#C0392B','#0E7C86'],
      map:{'#803737':'self','#0F0101':'self*0.2','#485BB9':'self','#181463':'self*0.2',
           '#6E1B09':'self','#321C01':'self*0.2',
           '#D8AB87':'kulit','#F0BE95':'kulit',
           '#E2805D':'kulit','#F7998E':'kulit', '#DEDEDE':'kulit',},
      parts:[
        {name:'', file:'Mata Kiri.svg',   x:121.93, y:261.35},
        {name:'', file:'Mata Tengah.svg', x:123, y:261.35},
        {name:'', file:'Mata Kanan.svg', x:123, y:261.35},
        {name:'', file:'Mata Lirik Kiri Atas.svg', x:123, y:261.35},
        {name:'', file:'Mata Lirik Kanan Atas.svg', x:123, y:261.35},
        {name:'', file:'Mata Bintang.svg', x:123, y:261.35} 
      ] },

    { k:'mulut', t:'Mulut', color:'#D85757', z:40, crop:'170 420 250 190', default:1,
      palette:['#D85757','#C0392B','#E88FA0','#8E3B46','#F28C6B','#6B2D5C', '#FDFDFD'],
      map:{'#D85757':'self','#EF9A85':'self+0.2','#CB6850':'self*0.85','#E8AFAF':'self+0.55','#D07B7B':'self+0.35', '#D77050': 'self',},
      parts:[
        {name:'', file:'Mulut nyeh.svg',   x:209.94, y:464.805, color: '#D85757'},
        {name:'', file:'Mulut senyum karir.svg', x:342, y:480},
        {name:'', file:'Mulut mringis.svg', x:215, y: 450, hideColor:true},
        {name:'', file:'Mulut senyum pendek.svg', x:310, y: 470},
        {name:'', file:'Mulut betmut.svg', x:310, y: 470},
        {name:'', file:'Mulut Taunt.svg', x:200, y: 440,hideColor:true},
        {name:'', file:'Mulut Geram.svg', x:260, y: 470, scale:0.75, hideColor:true},
        {name:'', file:'Mulut Gigit.svg', x:260, y: 470, scale:0.75, hideColor:true},
        {name:'', file:'Mulut Hehe.svg', x:240, y: 460, scale:0.7, hideColor:true},
        {name:'', file:'Mulut O.svg', x:324, y: 470, scale:0.9},
        {name:'', file:'Mulut Taring.svg', x:245, y: 475, scale:0.7, hideColor:true},
      ] },

    { k:'baju', t:'Baju', color:'#D9D9D9', z:0, crop:'0 600 694 140', default:0,
      palette:['#D3D3D3','#752F2F','#2F5D8A','#2E7D5B','#E8B94A','#8E5BD0','#F2A7C3','#222222'],
      map:{'#D3D3D3':'self', '#A5A2A0':'self*0.78'},
      parts:[
        {name:'', file:'Baju 3.svg', x:124, y:664}
      ] },

    { k:'asm', t:'Aksesoris', color:'#FFEA05', z:50, crop:'60 230 570 250', default:5, rare:true,
      palette:['#FFEA05','#D49C19','#6EE7FF','#FFFFFF','#9B7BFF','#2C768E',],
      palette:['#FFEA05','#D49C19','#6EE7FF','#FFFFFF','#9B7BFF','#2C768E',],
      map:{'#FFEA05':'self','#B46423':'self*0.65'},
      parts:[ null, 
        {name:'', file:'asesoris kacamata lebar.svg', x:5, y:255,
          colorOnUserChoice:true, map:{'#2C768E':'self'}},
        {name:'', file:'asesoris kacamata sempit.svg', x:125, y:350,
          colorOnUserChoice:true, map:{'#D49C19':'self'}},
        {name:'', file:'asesoris plester.svg', x:460, y:410, scale: 0.8,
          colorOnUserChoice:true, map:{'#E19965':'self','#C3804F':'self*0.78','#FBC197':'self+0.25','#EEB994':'self+0.2'}},
        {name:'', file:'Asesoris Anting.svg', x:605, y:485, previewCrop:'500 260 220 360',
          colorOnUserChoice:true, map:{'#FFF1C6':'self'}},
      ] },

    { k:'bg', t:'Background', color: '#CF5C2A', z:-20, default:1,
      palette:['#CF5C2A', '#9AC9D6', '#237EC6', '#010211', ],
      parts:[null,
        {name:'', file: 'bintang 1.png'},
        {name:'', file: 'bintang 2.png'},
        {name:'', file: 'bintang 3.png'},
        {name:'', file: 'bintang 4.png'},
        {name:'', file: 'bintang 5.png'},
        {name:'', solid:true}
      ]
    }

  ]
};
