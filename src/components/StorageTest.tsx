
import React, { useState, useEffect, useCallback } from 'react';
import { uploadFile, listFilesWithURLs, deleteFile } from '../services/storageService';
import { useError } from '../contexts/ErrorContext';
import { Upload, FileText, Trash2, Loader2, FlaskConical, ExternalLink } from 'lucide-react';

const UPLOAD_PATH = 'test-uploads';

const StorageTest: React.FC = () => {
  const [files, setFiles] = useState<{ name: string; fullPath: string; url: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { showError } = useError();

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const fileList = await listFilesWithURLs(UPLOAD_PATH);
      setFiles(fileList);
    } catch (err: any) {
      showError(err.message || 'Falha ao listar arquivos.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showError('Nenhum arquivo selecionado.');
      return;
    }
    setIsUploading(true);
    try {
      const filePath = `${UPLOAD_PATH}/${Date.now()}_${selectedFile.name}`;
      await uploadFile(selectedFile, filePath);
      setSelectedFile(null); // Clear input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
      await fetchFiles(); // Refresh list
    } catch (err: any) {
      showError(err.message || 'Falha no upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este arquivo?')) return;
    try {
      await deleteFile(filePath);
      await fetchFiles();
    } catch (err: any) {
      showError(err.message || 'Falha ao deletar arquivo.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold font-mono flex items-center gap-2 uppercase">
        <FlaskConical className="w-6 h-6 text-zinc-100" /> Teste de Storage
      </h2>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase">Upload de Arquivo</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex-1 w-full px-4 py-3 bg-zinc-950 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-500 transition-colors">
            <input type="file" id="file-input" onChange={handleFileSelect} className="hidden" />
            <span className="flex items-center justify-center gap-2 text-zinc-400">
              <Upload className="w-5 h-5" />
              {selectedFile ? selectedFile.name : 'Selecionar arquivo...'}
            </span>
          </label>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full sm:w-auto bg-white text-zinc-950 px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isUploading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-zinc-300 font-mono uppercase mb-4">Arquivos no Bucket ({UPLOAD_PATH}/)</h3>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-center text-zinc-500 py-8 font-mono">Nenhum arquivo encontrado.</p>
        ) : (
          <div className="space-y-3">
            {files.map(file => (
              <div key={file.fullPath} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 truncate">
                  <FileText className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white truncate hover:underline flex items-center gap-1.5">
                    {file.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(file.fullPath)}
                  className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-900/20 rounded-full transition-colors"
                  aria-label={`Deletar ${file.name}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageTest;
