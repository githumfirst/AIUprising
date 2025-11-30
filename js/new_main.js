document.addEventListener('DOMContentLoaded', () => {
    // Three.js Scene Setup
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const particles = new THREE.Group();
    const particleGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x00aaff });

    for (let i = 0; i < 500; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(10));
        particle.position.set(x, y, z);
        particles.add(particle);
    }
    scene.add(particles);

    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);
        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.001;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Content Population
    const projects = [
        { title: '엑셀파일 변형 및 생성 프로그램', description: 'C#으로 작성하였으며 업무용도로 커스터마이징 가능 함', source: 'https://github.com/githumfirst/IDcardsExcelAutomationGui?search=1', video: 'https://www.youtube.com/watch?v=YBx_BvuQBzE&list=PL5o1u6HCZ9Gcrl6ICSThkPymqrs04vMZZ&index=16' },
        { title: '로또 번호 자동 생성기', description: 'C#으로 작성', source: 'https://github.com/githumfirst/lotteNumberGenerator', video: 'https://www.youtube.com/watch?v=TMyqaxrhGaw&list=PL5o1u6HCZ9Gcrl6ICSThkPymqrs04vMZZ&index=7' },
        { title: 'RFID 생성기', description: '파이썬으로 작성', source: '#', video: 'https://www.youtube.com/watch?v=BmD-bos2jnY&list=PL5o1u6HCZ9Gcrl6ICSThkPymqrs04vMZZ&index=1' },
        { title: '인공지능 로또번호 생성기', description: '파이썬 및 인공지능 머신러닝 사용하여 제작', source: '#', video: 'https://www.youtube.com/watch?v=7S8phpIRXew&list=PL5o1u6HCZ9Gcrl6ICSThkPymqrs04vMZZ&index=2&t=2s' },
        { title: '미니 게임: floating', description: 'js로 제작.
* 소스: https://www.w3schools.com/graphics/tryit.asp?filename=trygame_default_gravity', source: 'https://multiplayer-demo-ac50d.web.app/', video: '#' },
        { title: '병정놀이 게임', description: 'js로 제작. openai chatgpt 3.5를 활용하여 만듦', source: 'https://github.com/githumfirst/githumfirst.github.io?search=1', video: 'https://githumfirst.github.io/' },
        { title: 'Monster Flight', description: 'unity로 제작', source: 'https://play.google.com/store/apps/details?id=com.nolgaemi.monster', video: 'https://youtube.com/shorts/YMnRnsPjmGs?si=doML47o6TM4u4CA4' },
    ];

    const channels = [
        { name: 'youtube', link: 'https://www.youtube.com/channel/UCgvNj4Wieo0EszdQUwKhe4w', handle: 'nolGaeMi:놀개미' },
        { name: '네이버 블로그', link: 'https://blog.naver.com/checrealname', handle: 'naver blog' },
        { name: 'google blogger', link: 'https://www.blogger.com/blog/posts/4241289837387021740?hl=en&tab=jj', handle: 'nolGaeMi blogger' }
    ];

    const staff = [
        { role: 'Chief Executive Officer', name: 'Jackie' },
        { role: 'Chief Public Relation Officer', name: 'EunSuk Park' },
        { role: 'Chief HRD Officer', name: 'JaeMo' },
        { role: 'Chief Technical Manager', name: 'DakGu' },
        { role: 'Software Engineer', name: 'Tommy' },
    ];

    const projectContainer = document.querySelector('#projects .card-container');
    projects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${p.title}</h3>
            <p>${p.description}</p>
            <div>
                ${p.source !== '#' ? `<a href="${p.source}" target="_blank">Source Code</a>` : ''}
                ${p.video !== '#' ? `<a href="${p.video}" target="_blank">Watch Video</a>` : ''}
            </div>
        `;
        projectContainer.appendChild(card);
    });

    const channelContainer = document.querySelector('#channels .card-container');
    channels.forEach(c => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${c.name}</h3>
            <p>Handle: ${c.handle}</p>
            <a href="${c.link}" target="_blank">Visit Channel</a>
        `;
        channelContainer.appendChild(card);
    });

    const staffContainer = document.querySelector('#staff .card-container');
    staff.forEach(s => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${s.role}</h3>
            <p>${s.name}</p>
        `;
        staffContainer.appendChild(card);
    });
});
