var texto = document.getElementById("texto");
document.getElementsByTagName("body")[0].addEventListener("load", iniciar(), false);

var contextoDeAudio = new AudioContext(); //cria um set de audio
var analisador = contextoDeAudio.createAnalyser(); //cria um nó capaz de prover analises de áudio em tempo real
analisador.fftSize = 64; //valor que determina o tamanho do dominio de frequências a ser analisado
var dadosDoVetor = new Uint8Array(analisador.frequencyBinCount); //cria um vetor de bytes com o mesmo número de indices do vetor de dados do analisador

var reconhecimentoDeFala; //guardará o objeto responsável pelo reconhecimento da fala
var volumeDoMic = 0; //volume de áudio ao qual o microfone é submetido. Este valor é atualizado constantemente

var semaforo; //semáforo que indica se algum processo de transcrição está em andamento


function iniciar()
{
	if ("webkitSpeechRecognition" in window)
	{
		reconhecimentoDeFala = new webkitSpeechRecognition(); //objeto responsável pelo reconhecimento da fala
		reconhecimentoDeFala.continuous = false; //atributo que indica se o microfone continuará sendo monitorado após o recebimento do primeiro resultado
		reconhecimentoDeFala.interimResults = true; //exibição dos resultados provisórios obtidos. A tela vai sendo alterada em tempo real
		reconhecimentoDeFala.lang = "pt-BR"; //idioma
		reconhecimentoDeFala.addEventListener("end", fimDaTranscricao);
		reconhecimentoDeFala.addEventListener("result", resultadoRecebido); //observa quando há mudança nos resultados provisórios ou definitivos
		reconhecimentoDeFala.addEventListener("error", function (erro){ console.log(erro); }); //caso haja erro ao carregar o speech
		navigator.webkitGetUserMedia ({audio:true}, prepararMic, function(e){console.log("Erro: " + e);}); //prepara o microfone para ser monitorado
		semaforo = 0;
		monitorarVolume(); //monitora se algum áudio válido sendo falado no microfone
	}
	else
		texto.innerHTML = "Reconhecimento de voz indisponível neste navegador.<br/>Utilize a versão mais atual do Chrome.";
}

function fimDaTranscricao ()
{
	semaforo = 0; //abre o semáforo para que outra transcrição possa ser feita
	console.log("fim");
	setTimeout(monitorarVolume, 20); //volta a monitorar o volume do microfone
}

//printa na tela o resultado da transcrição
function resultadoRecebido (evento)
{
	var transcrito = "";

	for (var i=0 ; i < event.results.length ; ++i)
		transcrito += event.results[i][0].transcript;
	
	texto.innerHTML = transcrito;
}

function monitorarVolume()
{
	if(semaforo==0)
	{
		if(volumeDoMic > 80)
		{
			semaforo = 1;
			reconhecimentoDeFala.start();
			console.log("inicio");
		}
		else
			setTimeout(monitorarVolume, 10);
	}
	else
		return;
}

//monitorar o microfone
function prepararMic(stream)
{	
	var fonteDoStream = contextoDeAudio.createMediaStreamSource(stream); //
	fonteDoStream.connect(analisador);	
	
	analisador.getByteFrequencyData(dadosDoVetor);
	
	monitorarMic();
}

function monitorarMic()
{
	analisador.getByteFrequencyData(dadosDoVetor);
	setTimeout(function(){ volumeDoMic = volume(dadosDoVetor); monitorarMic();}, 10);
}

function volume (dadosDoVetor)
{
	var acumulador = 0;

	var tam = dadosDoVetor.length/2;
	
	for (var i = 8; i < tam; i++) 
		acumulador += dadosDoVetor[i];

	return acumulador / tam;
}
