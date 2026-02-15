// Loader to inject shared header, modal, footer then load main script
(function(){
    async function load(path, id) {
        try {
            const res = await fetch(path);
            if (res.ok) {
                document.getElementById(id).innerHTML = await res.text();
            }
        } catch (e) { console.warn('load shared:', path, e); }
    }

    Promise.all([
        load('shared/header.html','site-header'),
        load('shared/modal.html','site-modal'),
        load('shared/footer.html','site-footer')
    ]).then(()=>{
        const s = document.createElement('script');
        s.src = 'scripts/script.js';
        s.defer = true;
        document.body.appendChild(s);
    });
})();
