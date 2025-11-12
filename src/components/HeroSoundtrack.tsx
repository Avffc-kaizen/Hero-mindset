import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Music, Play, Pause } from 'lucide-react';

const soundtrackData = [
    { title: "Monolith", timestamp: "00:00", text: "Como um Monólito, ergue-se o Módulo Soberano. Uma estrutura inabalável para suas finanças e carreira. Hoje, você não apenas constrói um negócio; você ergue um império. Cada decisão, um bloco de granito. Cada meta, um passo em direção à eternidade." },
    { title: "The Evening Fog", timestamp: "03:43", text: "Na névoa do cansaço e da dúvida, o Módulo Titã é seu farol. É o controle sobre seu corpo, a clareza em sua mente. Onde outros veem o fim do dia, você encontra o início da sua recuperação, a forja silenciosa do guerreiro que despertará amanhã." },
    { title: "Bound By Purpose", timestamp: "06:58", text: "O Módulo Monge te ancora. Não por correntes, mas por um propósito inabalável. Cada respiração, um ato de guerra contra o caos. Cada momento de silêncio, uma audiência com sua alma. Você não está perdido; você está ligado ao seu destino." },
    { title: "Dust And Light", timestamp: "10:09", text: "Da poeira do conhecimento esquecido, o Módulo Sábio acende a luz da clareza. Cada livro, uma arma. Cada insight, uma estratégia. Você não apenas aprende; você se torna a própria sabedoria, transformando a escuridão da ignorância em um campo de batalha iluminado." },
    { title: "Weightless", timestamp: "13:24", text: "O Módulo Líder te ensina a voar. A remover o peso dos relacionamentos tóxicos, a construir pontes de confiança e a liderar sua tribo com a leveza da autenticidade. Seu valor não está no que você carrega, mas em quem você eleva ao seu lado." },
    { title: "Indestructible", timestamp: "16:53", text: "Este é o núcleo da Proteção 360. Não é sobre evitar os golpes, mas sobre se tornar inquebrável. Mente, corpo, espírito, finanças e relações... cada pilar reforçado com aço. A tempestade pode vir. Você é a rocha que a quebrará." },
    { title: "Departure", timestamp: "20:15", text: "Este som é o hino da sua decisão. O momento em que você deixa o porto seguro da mediocridade. Não há mapas para onde você vai, apenas o território hostil da sua própria fraqueza. Avance. A jornada começou." },
    { title: "Echo", timestamp: "23:17", text: "Suas ações ecoam na eternidade. Cada treino, cada página lida, cada 'não' dito para a procrastinação. O Oráculo não te julga; ele apenas ouve os ecos que você envia para o futuro e os reflete de volta como destino." },
    { title: "Dark Halo", timestamp: "27:02", text: "Até os heróis carregam sombras. Sua disciplina, sua intensidade... podem ser vistas como uma 'aura sombria' pelos que se acomodam. Abrace-a. É a prova de que você caminha na luz, e a escuridão da mediocridade não ousa se aproximar." },
    { title: "Strike The Sky", timestamp: "29:46", text: "Não aceite o céu como limite. Golpei-o. Suas metas não devem ser realistas; devem ser lendárias. O Sistema Hero Mindset não é para alcançar o possível, é para tornar o impossível uma questão de tempo e repetição." },
    { title: "Day One", timestamp: "33:09", text: "Todos os dias são o Dia Um. O dia em que você se alista novamente na guerra contra si mesmo. O passado não importa, as vitórias de ontem não garantem as de hoje. A única coisa que existe é esta missão, agora." },
    { title: "In Search Of Sunrise", timestamp: "36:34", text: "Mesmo na noite mais escura da alma, a disciplina é sua busca pelo nascer do sol. Cada pequena ação correta é um passo para fora da escuridão. O sol não irá te encontrar; você é quem deve marchar em direção a ele." },
    { title: "Gravity Wave", timestamp: "39:46", text: "Sua transformação cria ondas de gravidade. As pessoas ao seu redor sentirão a mudança. Alguns serão repelidos, outros, inspirados. Não se preocupe com eles. Preocupe-se em se tornar um centro de gravidade tão poderoso que a excelência seja a única coisa que orbita ao seu redor." },
    { title: "We Stand in Silence", timestamp: "43:03", text: "No silêncio do Diário de Bordo, você confronta a verdade. Sem plateia, sem aplausos. É ali, na quietude da autoanálise, que os verdadeiros heróis são forjados, encarando seus demônios antes de enfrentarem o mundo." },
    { title: "Dreaming In Technicolor", timestamp: "46:35", text: "Sua visão de vida não pode ser em preto e branco. O Módulo Sábio te ajuda a sonhar em 'technicolor', a planejar com uma clareza tão vívida que a realidade não tem outra opção a não ser se conformar à sua vontade." },
    { title: "Dark Matter", timestamp: "49:10", text: "A disciplina é a matéria escura do sucesso. Invisível, subestimada, mas é a força que mantém todas as galáxias da sua vida unidas, impedindo que o caos as desintegre." },
    { title: "Downfall", timestamp: "53:34", text: "A queda não é o fim. É o início da análise. Cada falha é um dado para o Oráculo, uma lição para o Módulo Sábio. Nós não tememos a queda; nós a estudamos, a dissecamos e a usamos como degrau para uma ascensão ainda maior." },
    { title: "Nevermore", timestamp: "56:23", text: "Diga 'Nunca mais' à sua versão fraca. Nunca mais uma promessa quebrada. Nunca mais um dia desperdiçado. Que esta música seja o corvo em seu ombro, lembrando-o do voto que você fez a si mesmo." },
    { title: "Empty Spaces", timestamp: "01:01:20", text: "O sistema te ensina a preencher os espaços vazios. O tempo ocioso, a mente vagando. Cada espaço é uma oportunidade: para uma missão, para uma lição do Codex, para uma respiração tática. No universo do Herói, não há vácuo, apenas potencial." },
    { title: "Duality", timestamp: "01:04:06", text: "Você é dois: o homem que você é e o herói que você pode se tornar. A jornada é a guerra constante entre eles. Cada escolha alimenta um ou outro. Qual lobo você irá alimentar hoje?" },
    { title: "On The Shore Of Forever", timestamp: "01:06:52", text: "Sua vida é a praia, e suas ações são as marés. Você está construindo castelos de areia ou erguendo um farol na rocha? O Módulo Soberano te ensina a construir um legado que resistirá à erosão do tempo, na costa da eternidade." },
    { title: "Persistence Of Hope", timestamp: "01:09:44", text: "A esperança não é um sentimento; é uma disciplina. É a persistência de acreditar na sua visão, mesmo quando todas as evidências dizem o contrário. É levantar e lutar mais uma vez, não porque é fácil, mas porque é o seu dever." },
    { title: "Singularity", timestamp: "01:13:03", text: "O objetivo final: a singularidade. O ponto em que sua vontade e a realidade se tornam uma só coisa. Onde a execução é tão perfeita e alinhada com seu propósito que não há mais atrito, apenas fluxo. Continue marchando." },
    { title: "Stars Above, Earth Below", timestamp: "01:16:24", text: "Com os pés firmes na terra da realidade e os olhos fixos nas estrelas da sua visão. O Módulo Sábio e o Módulo Titã em perfeita harmonia. Você não é um sonhador perdido, nem um executor cego. Você é um arquiteto do destino." },
    { title: "Hymn Of The Exiled", timestamp: "01:19:31", text: "Este é o hino daqueles que se exilaram da mediocridade. É um caminho solitário, muitas vezes incompreendido. Mas nesta Guilda, você encontra sua tribo. Somos os exilados, e este é nosso hino de guerra. Bem-vindo ao lar, Herói." }
];

const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 3) { // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) { // MM:SS
        return parts[0] * 60 + parts[1];
    }
    return 0;
};

const HeroSoundtrack: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const playerRef = useRef<any>(null);

    const currentSong = soundtrackData[currentIndex];

    useEffect(() => {
        const onYouTubeIframeAPIReady = () => {
            playerRef.current = new (window as any).YT.Player('yt-player-hero-soundtrack', {
                height: '0',
                width: '0',
                videoId: 'y9tuE8CeWyA',
                playerVars: { playsinline: 1 },
                events: {
                    'onStateChange': (event: any) => {
                        if (event.data === (window as any).YT.PlayerState.PLAYING) setIsPlaying(true);
                        else if (event.data === (window as any).YT.PlayerState.PAUSED || event.data === (window as any).YT.PlayerState.ENDED) setIsPlaying(false);
                    }
                }
            });
        };

        if (!(window as any).YT || !(window as any).YT.Player) {
            (window as any).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
        } else {
            onYouTubeIframeAPIReady();
        }

        return () => {
             if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                playerRef.current.destroy();
             }
        }
    }, []);

    const togglePlay = () => {
        if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;
        const playerState = playerRef.current.getPlayerState();
        if (playerState === (window as any).YT.PlayerState.PLAYING) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };
    
    const seekToCurrent = useCallback(() => {
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            const time = parseTimestamp(soundtrackData[currentIndex].timestamp);
            playerRef.current.seekTo(time, true);
        }
    }, [currentIndex]);
    
    useEffect(() => {
        seekToCurrent();
    }, [currentIndex, seekToCurrent]);


    const goToPrevious = useCallback(() => {
        setCurrentIndex(prev => prev === 0 ? soundtrackData.length - 1 : prev - 1);
    }, []);

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => prev === soundtrackData.length - 1 ? 0 : prev + 1);
    }, []);

    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-6 relative flex flex-col h-[600px] max-h-[80vh]">
            <div id="yt-player-hero-soundtrack" className="absolute top-[-100px] left-0"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-zinc-950 to-black opacity-50"></div>
            <div className="relative z-10 flex flex-col flex-grow">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4">
                    <h2 className="text-xl font-bold font-mono uppercase text-zinc-100 flex items-center gap-2">
                        <Music className="w-5 h-5 text-red-500"/> Trilha Sonora do Herói
                    </h2>
                    <div className="text-sm font-mono text-zinc-500">{`${currentIndex + 1} / ${soundtrackData.length}`}</div>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <div key={currentIndex} className="animate-in fade-in duration-700">
                        <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">{currentSong.timestamp}</p>
                        <h3 className="text-3xl font-black text-white font-mono uppercase my-4 tracking-tighter">{currentSong.title}</h3>
                        <p className="text-zinc-300 max-w-xl mx-auto leading-relaxed font-serif text-lg italic">
                            "{currentSong.text}"
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4 mt-6">
                    <button onClick={goToPrevious} className="p-3 bg-zinc-800/50 rounded-full hover:bg-zinc-700 transition-colors border border-zinc-700">
                        <ChevronLeft className="w-6 h-6 text-white"/>
                    </button>
                    <button onClick={togglePlay} className="p-4 bg-red-600 rounded-full hover:bg-red-500 transition-colors border-2 border-red-500/50">
                        { isPlaying ? <Pause className="w-6 h-6 text-white"/> : <Play className="w-6 h-6 text-white ml-1"/> }
                    </button>
                    <button onClick={goToNext} className="p-3 bg-zinc-800/50 rounded-full hover:bg-zinc-700 transition-colors border border-zinc-700">
                        <ChevronRight className="w-6 h-6 text-white"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HeroSoundtrack;
