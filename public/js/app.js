// public/js/app.js (Extracto de lógica)

async function handleEnrollment(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const personalInfo = formData.get('personal_info');
    const paymentFile = formData.get('payment_capture');

    // PASO 1: Subir archivo de pago a un servicio (e.g., Cloudinary)
    // const paymentCaptureUrl = await uploadFile(paymentFile); 

    const paymentCaptureUrl = 'url_del_capture_de_pago_subido'; // Simulación

    // PASO 2: Enviar datos al backend
    const response = await fetch('/.netlify/functions/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalInfo, paymentCaptureUrl, courseId: 1 })
    });

    if (response.ok) {
        alert('Inscripción enviada. Esperando aprobación del administrador.');
    } else {
        alert('Error al enviar la inscripción.');
    }
}