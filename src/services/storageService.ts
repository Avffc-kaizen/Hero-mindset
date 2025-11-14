import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll, type FirebaseStorage } from "firebase/storage";
import { getFirebaseApp, getIsFirebaseConfigured } from "../firebase";

let storage: FirebaseStorage | null = null;

const checkStorage = (): FirebaseStorage => {
    if (!storage && getIsFirebaseConfigured()) {
        const app = getFirebaseApp();
        if (app) {
            storage = getStorage(app);
        }
    }
    if (!storage) {
        throw new Error("Firebase Storage não está configurado.");
    }
    return storage;
}

/**
 * Faz upload de um arquivo para o Firebase Storage
 * @param file Arquivo (File ou Blob) a ser enviado
 * @param path Caminho dentro do bucket (ex: "uploads/meuarquivo.png")
 * @returns URL pública de download
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  const storageInstance = checkStorage();
  const fileRef = ref(storageInstance, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

/**
 * Obtém a URL pública de um arquivo já existente
 * @param path Caminho dentro do bucket
 * @returns URL pública de download
 */
export async function getFileURL(path: string): Promise<string> {
  const storageInstance = checkStorage();
  const fileRef = ref(storageInstance, path);
  return await getDownloadURL(fileRef);
}

/**
 * Remove um arquivo do Storage
 * @param path Caminho dentro do bucket
 */
export async function deleteFile(path: string): Promise<void> {
  const storageInstance = checkStorage();
  const fileRef = ref(storageInstance, path);
  await deleteObject(fileRef);
}

/**
 * Lista todos os arquivos em um dado caminho.
 * @param path Caminho dentro do bucket (ex: "uploads/")
 * @returns Array de objetos com nome, path completo e URL de download.
 */
export async function listFilesWithURLs(path: string): Promise<{ name: string; fullPath: string; url: string }[]> {
    const storageInstance = checkStorage();
    const listRef = ref(storageInstance, path);
    const res = await listAll(listRef);
    
    const files = await Promise.all(
        res.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            return {
                name: itemRef.name,
                fullPath: itemRef.fullPath,
                url: url,
            };
        })
    );
    return files;
}