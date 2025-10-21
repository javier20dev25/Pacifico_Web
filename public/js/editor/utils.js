import { selectors } from './config.js';

export function getCurrencySymbol(currency) {
    return currency === 'NIO' ? 'C$' : '$';
}

export function showMessage(message) {
    if (selectors.messageText) selectors.messageText.textContent = message;
    if (selectors.messageModal) selectors.messageModal.classList.remove('hidden');
}

export function showYouTubeVideo(youtubeUrl) {
    const videoModal = selectors.videoModal;
    const videoContent = selectors.videoContent;
    const closeVideoModal = selectors.closeVideoModal;
    if (!videoModal || !videoContent || !closeVideoModal) return;

    // Extraer ID de YouTube
    let videoId = '';
    const url = new URL(youtubeUrl);
    if (url.hostname === 'youtu.be') {
        videoId = url.pathname.slice(1);
    } else if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
        videoId = url.searchParams.get('v');
    }

    if (!videoId) {
        showMessage('El enlace de YouTube no es válido.');
        return;
    }

    videoContent.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    videoModal.classList.remove('hidden');

    const closeModal = () => {
        videoModal.classList.add('hidden');
        videoContent.innerHTML = ''; // Detener el video
        closeVideoModal.removeEventListener('click', closeModal);
        videoModal.removeEventListener('click', handleOverlayClick);
    };

    const handleOverlayClick = (e) => {
        if (e.target === videoModal) {
            closeModal();
        }
    };

    closeVideoModal.addEventListener('click', closeModal);
    videoModal.addEventListener('click', handleOverlayClick);
}

let toastTimeout;
export function showToast(message) {
    const { toastNotification, toastMessage } = selectors;
    if (!toastNotification || !toastMessage) return;

    clearTimeout(toastTimeout);

    toastMessage.textContent = message;
    toastNotification.classList.remove('translate-x-[120%]');

    toastTimeout = setTimeout(() => {
        toastNotification.classList.add('translate-x-[120%]');
    }, 3000); // Ocultar después de 3 segundos
}