/**
 * Serviço de Upload de Imagens para ImgBB
 */

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export interface ImageUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Faz upload de uma imagem para o ImgBB
 * @param file - Arquivo de imagem
 * @returns URL da imagem hospedada
 */
export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  if (!IMGBB_API_KEY) {
    return {
      success: false,
      error: 'API key do ImgBB não configurada',
    };
  }

  try {
    // Converter arquivo para base64
    const base64 = await fileToBase64(file);

    // Remover o prefixo data:image/...;base64,
    const base64Data = base64.split(',')[1];

    // Criar FormData para envio
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Data);

    // Fazer upload
    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success && data.data?.url) {
      return {
        success: true,
        url: data.data.url,
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Erro ao fazer upload da imagem',
      };
    }
  } catch (error) {
    console.error('Erro no upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao fazer upload',
    };
  }
}

/**
 * Converte arquivo para base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao converter arquivo'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
