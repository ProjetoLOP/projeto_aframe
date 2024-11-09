// Obtém os elementos do DOM e inicializa o contexto 2D do canvas
let videoElement = document.getElementById("video");
let canvasElement = document.getElementById("canvas");
let canvasCtx = canvasElement.getContext("2d");

/**
 * Função principal que é chamada toda vez que o MediaPipe Hands detecta novos resultados
 * @param {Object} results - Objeto contendo os landmarks (pontos) das mãos detectadas
 */
function onResults(results) {
    // Define a cor de fundo e limpa o canvas para o próximo frame
    canvasCtx.fillStyle = '#1b2531';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Salva o estado atual do contexto do canvas antes de fazer transformações
    canvasCtx.save();
    
    // Aplica transformações para corrigir o efeito espelho da câmera:
    // 1. scale(-1, 1) inverte horizontalmente (espelha)
    // 2. translate move o canvas de volta para a posição correta após o espelhamento
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-canvasElement.width, 0);

    // Se foram detectadas mãos na imagem
    if (results.multiHandLandmarks) {
        // Para cada mão detectada
        for (const landmarks of results.multiHandLandmarks) {
            // Primeiro desenha as linhas que conectam os pontos
            drawConnections(landmarks);
            
            // Depois desenha os pontos (landmarks) por cima das linhas
            drawLandmarks(landmarks);
        }
    }

    // Restaura o estado original do contexto do canvas
    canvasCtx.restore();
}

/**
 * Desenha as linhas que conectam os pontos (landmarks) da mão
 * @param {Array} landmarks - Array de pontos (x,y,z) que representam a mão
 */
function drawConnections(landmarks) {
    canvasCtx.beginPath();
    // Define o estilo das linhas
    canvasCtx.strokeStyle = '#fff';
    canvasCtx.lineWidth = 3;
    canvasCtx.lineJoin = 'round';
    canvasCtx.lineCap = 'round';

    // Define as conexões para cada dedo
    // Cada array representa um dedo e seus pontos de conexão
    // O ponto 0 é a base da palma da mão
    const fingerConnections = [
        [0,1,2,3,4],     // Polegar: base → ponta
        [0,5,6,7,8],     // Indicador: base → ponta
        [0,9,10,11,12],  // Médio: base → ponta
        [0,13,14,15,16], // Anelar: base → ponta
        [0,17,18,19,20]  // Mindinho: base → ponta
    ];

    // Para cada dedo, desenha as linhas conectando seus pontos
    fingerConnections.forEach(finger => {
        for(let i = 1; i < finger.length; i++) {
            const start = landmarks[finger[i-1]];
            const end = landmarks[finger[i]];
            
            // Converte as coordenadas normalizadas (0-1) para pixels do canvas
            canvasCtx.moveTo(
                start.x * canvasElement.width,
                start.y * canvasElement.height
            );
            canvasCtx.lineTo(
                end.x * canvasElement.width,
                end.y * canvasElement.height
            );
        }
    });
    
    canvasCtx.stroke();
}

/**
 * Desenha os pontos (landmarks) da mão
 * @param {Array} landmarks - Array de pontos (x,y,z) que representam a mão
 */
function drawLandmarks(landmarks) {
    landmarks.forEach(landmark => {
        // Desenha um círculo maior em azul claro para criar um efeito de brilho
        canvasCtx.beginPath();
        canvasCtx.fillStyle = 'rgba(33, 150, 243, 0.3)';
        canvasCtx.arc(
            landmark.x * canvasElement.width,
            landmark.y * canvasElement.height,
            6,  // Raio do círculo maior
            0,
            2 * Math.PI
        );
        canvasCtx.fill();

        // Desenha um círculo menor em branco por cima
        canvasCtx.beginPath();
        canvasCtx.fillStyle = '#fff';
        canvasCtx.arc(
            landmark.x * canvasElement.width,
            landmark.y * canvasElement.height,
            3,  // Raio do círculo menor
            0,
            2 * Math.PI
        );
        canvasCtx.fill();
    });
}

// Inicializa o modelo MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

// Configura as opções do modelo
hands.setOptions({
    maxNumHands: 2,              // Número máximo de mãos que podem ser detectadas
    modelComplexity: 0,          // Complexidade do modelo (0: Lite, 1: Full)
    minDetectionConfidence: 0.5, // Confiança mínima para detecção
    minTrackingConfidence: 0.5   // Confiança mínima para rastreamento
});

// Associa a função de callback que será chamada quando houver novos resultados
hands.onResults(onResults);

// Inicializa a câmera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        // Envia cada frame do vídeo para o modelo processar
        await hands.send({image: videoElement});
    },
    width: 640,   // Largura do vídeo
    height: 480   // Altura do vídeo
});

// Inicia a captura da câmera
camera.start();