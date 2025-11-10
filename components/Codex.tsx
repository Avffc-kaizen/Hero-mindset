import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Book, Lock, Play, ChevronLeft, CheckCircle, Zap, Quote as QuoteIcon, PenTool, MonitorPlay, Loader2, Search, Tag, AlertCircle, Maximize } from 'lucide-react';
import { Module, LessonDetails } from '../types';

interface CodexProps {
  modules: Module[];
  onCompleteLesson: (lesson: LessonDetails) => void;
  hasSubscription: boolean;
  onUpgrade: () => void;
  isDailyLimitReached: boolean;
}

const Codex: React.FC<CodexProps> = ({ modules, onCompleteLesson, hasSubscription, onUpgrade, isDailyLimitReached }) => {
  const [selectedLesson, setSelectedLesson] = useState<LessonDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [playVideo, setPlayVideo] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (selectedLesson?.videoId) {
      setIsVideoLoading(true);
    }
  }, [selectedLesson]);

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      } else if ((iframeRef.current as any).mozRequestFullScreen) { /* Firefox */
        (iframeRef.current as any).mozRequestFullScreen();
      } else if ((iframeRef.current as any).webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        (iframeRef.current as any).webkitRequestFullscreen();
      } else if ((iframeRef.current as any).msRequestFullscreen) { /* IE/Edge */
        (iframeRef.current as any).msRequestFullscreen();
      }
    }
  };

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    modules.forEach(mod => {
      mod.lessons.forEach(lesson => {
        lesson.tags?.forEach(tag => tagsSet.add(tag));
      });
    });
    return Array.from(tagsSet).sort();
  }, [modules]);

  const handleSelectLesson = (lesson: LessonDetails) => {
    if (lesson.locked) return;
    setSelectedLesson(lesson);
    setPlayVideo(false); // Reset video state on new lesson selection
  };

  const handleComplete = () => {
    if (selectedLesson && !isDailyLimitReached) {
       const updatedLesson = { ...selectedLesson, completed: true };
       setSelectedLesson(updatedLesson);
       onCompleteLesson(selectedLesson);
    }
  };

  const filteredModules = modules.map(mod => ({
      ...mod,
      lessons: mod.lessons.filter(lesson => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchQuery
          ? lesson.title.toLowerCase().includes(searchLower) ||
            (lesson.subtitle && lesson.subtitle.toLowerCase().includes(searchLower))
          : true;
        
        const matchesTag = selectedTag === 'all' || (lesson.tags?.includes(selectedTag));
        
        return matchesSearch && matchesTag;
      })
    })).filter(mod => mod.lessons.length > 0);

  return (
    <>
      {selectedLesson ? (
        <div key="lesson-details" className="p-4 md:p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-5">
          <button 
            onClick={() => setSelectedLesson(null)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors active:scale-95 text-sm font-mono uppercase"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar ao Codex
          </button>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative">
            {selectedLesson.videoId && (
              <div className="aspect-video w-full bg-black flex items-center justify-center relative group">
                {!playVideo ? (
                  <>
                    <img
                      src={`https://i.ytimg.com/vi/${selectedLesson.videoId}/hqdefault.jpg`}
                      alt={`Thumbnail da lição: ${selectedLesson.title}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <button
                      onClick={() => setPlayVideo(true)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 transition-colors group-hover:bg-black/60"
                      aria-label={`Play video: ${selectedLesson.title}`}
                    >
                      <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/20 group-hover:bg-red-600 group-hover:border-red-500 transition-all duration-300">
                         <Play className="w-12 h-12 text-white drop-shadow-lg transition-transform group-hover:scale-110 ml-2" />
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    {isVideoLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-500">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    )}
                    <iframe
                      ref={iframeRef}
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${selectedLesson.videoId}?rel=0&modestbranding=1&showinfo=0&autoplay=1`}
                      title={selectedLesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      className={`w-full h-full ${isVideoLoading ? 'invisible' : 'visible'}`}
                      onLoad={() => setIsVideoLoading(false)}
                    ></iframe>
                     {!isVideoLoading && (
                      <button
                        onClick={handleFullscreen}
                        className="absolute bottom-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors z-10 active:scale-95"
                        aria-label="Tela cheia"
                      >
                        <Maximize className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            
            <div className="p-6 space-y-6">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-2xl font-bold text-white font-mono uppercase mb-1">{selectedLesson.title}</h2>
                <p className="text-zinc-400 font-mono text-sm uppercase tracking-wider">{selectedLesson.subtitle}</p>
              </div>

              {(selectedLesson.description || selectedLesson.quote) ? (
                <>
                  {selectedLesson.quote && (
                    <div className="relative pl-6 border-l-2 border-red-800 italic text-zinc-300 bg-zinc-950/50 p-4 rounded-r-lg">
                      <QuoteIcon className="w-4 h-4 text-red-800 absolute top-4 left-2 opacity-50" />
                      <p className="font-serif text-lg leading-relaxed">"{selectedLesson.quote}"</p>
                    </div>
                  )}

                  {selectedLesson.description && (
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono uppercase mb-2 flex items-center gap-2">
                        <Book className="w-4 h-4" /> Guia do Herói
                      </h3>
                      <p className="text-zinc-400 leading-relaxed">{selectedLesson.description}</p>
                    </div>
                  )}

                  {(selectedLesson.mission || selectedLesson.tool) && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {selectedLesson.mission && (
                        <div className="bg-zinc-950 border border-red-900/30 p-4 rounded-lg">
                          <h3 className="text-sm font-bold text-red-400 font-mono uppercase mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Desafio Prático
                          </h3>
                          <p className="text-zinc-300 text-sm">{selectedLesson.mission}</p>
                        </div>
                      )}
                      
                      {selectedLesson.tool && (
                        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg">
                          <h3 className="text-sm font-bold text-zinc-200 font-mono uppercase mb-2 flex items-center gap-2">
                            <PenTool className="w-4 h-4" /> Ferramenta do Herói
                          </h3>
                          <p className="text-zinc-300 text-sm">{selectedLesson.tool}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                 <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center mt-4">
                  <p className="text-zinc-400 text-sm max-w-md mx-auto">
                    Conteúdo desta lição sendo preparado.
                  </p>
                </div>
              )}
              
              {!selectedLesson.completed && isDailyLimitReached && (
                 <div className="w-full py-4 mt-4 bg-zinc-800 text-yellow-500 font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 cursor-not-allowed font-mono text-sm">
                   <AlertCircle className="w-5 h-5" /> Limite diário de lições atingido
                 </div>
              )}

              {!selectedLesson.completed && !isDailyLimitReached && (
                <button 
                  onClick={handleComplete} 
                  className="w-full py-4 mt-4 bg-zinc-100 text-zinc-950 font-bold uppercase tracking-widest rounded hover:bg-white transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" /> Concluir Desafio (+50 XP)
                </button>
              )}

               {selectedLesson.completed && (
                 <div className="w-full py-4 mt-4 bg-zinc-800 text-zinc-400 font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 cursor-not-allowed font-mono">
                   <CheckCircle className="w-5 h-5" /> Desafio Concluído
                 </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div key="codex-list" className="p-4 sm:p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 font-mono flex items-center gap-2 uppercase">
            <Book className="w-6 h-6 text-zinc-100" /> Codex do Conhecimento
          </h2>

          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar sabedoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors font-mono text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Tag className="w-4 h-4 text-zinc-500" />
              <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-3 py-1 text-xs font-mono uppercase rounded-full transition-colors active:scale-95 ${
                    selectedTag === 'all' ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/80'
                  }`}
                >
                  Todas
                </button>
                {allTags.map(tag => (
                  <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 text-xs font-mono uppercase rounded-full transition-colors active:scale-95 ${
                        selectedTag === tag ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/80'
                      }`}
                    >
                      {tag}
                    </button>
                ))}
            </div>
          </div>

          <div className="space-y-6">
            {filteredModules.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 font-mono">
                Nenhum registro encontrado para os filtros atuais.
              </div>
            ) : (
              filteredModules.map((mod) => {
                const completedCount = mod.lessons.filter(l => l.completed).length;
                const totalCount = mod.lessons.length;
                const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                return (
                  <div key={mod.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="bg-zinc-800 px-4 py-3">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold font-mono uppercase tracking-wider text-sm">{mod.title}</h3>
                        <span className="text-xs bg-zinc-900 px-2 py-1 rounded-full text-zinc-400 font-mono">{completedCount}/{totalCount}</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-1.5">
                        <div
                          className="bg-red-700 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="divide-y divide-zinc-800">
                      {mod.lessons.map((lesson) => (
                        <div 
                          key={lesson.id} 
                          className={`p-4 transition ${lesson.locked ? 'opacity-50 cursor-not-allowed bg-zinc-950' : 'hover:bg-zinc-900/50 cursor-pointer'}`}
                          onClick={() => handleSelectLesson(lesson)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {lesson.locked ? (
                                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                                  <Lock className="w-4 h-4 text-zinc-600" />
                                </div>
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${lesson.completed ? 'bg-green-900/20 text-green-500' : 'bg-zinc-800 text-zinc-100'}`}>
                                  {lesson.completed ? <CheckCircle className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
                                </div>
                              )}
                              <div>
                                <p className={`${lesson.locked ? 'text-zinc-600' : 'text-zinc-200'} font-medium`}>{lesson.title}</p>
                                {lesson.subtitle && !lesson.locked && (
                                  <p className="text-xs text-zinc-500 font-mono mt-1">{lesson.subtitle}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {!lesson.locked && !lesson.completed && (
                                <span className="hidden sm:inline-flex text-xs bg-zinc-800 text-zinc-300 px-3 py-1 rounded font-mono uppercase items-center gap-1">
                                  <MonitorPlay className="w-3 h-3" /> Iniciar
                                </span>
                              )}
                              {lesson.completed && <span className="hidden sm:inline-flex text-xs text-zinc-500 font-mono uppercase">Concluído</span>}
                              {lesson.locked && <Lock className="w-4 h-4 text-zinc-700" />}
                            </div>
                          </div>
                          {lesson.tags && !lesson.locked && (
                              <div className="mt-3 flex flex-wrap gap-2 pl-11">
                                {lesson.tags.map(tag => (
                                  <span key={tag} className="text-xs bg-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded-full font-mono">{tag}</span>
                                ))}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Codex;