//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

function startRecording() {
	console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: true, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

	recordButton.disabled = true;
	stopButton.disabled = false;

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	if (navigator.mediaDevices === undefined) {
		alert("Your browser does not support the MediaDevices API under an unsecured connection. Please use HTTPS. For development on chrome add this url to chrome://flags/#unsafely-treat-insecure-origin-as-secure ");
		recordButton.disabled = false;
    	stopButton.disabled = true;
		return;
	}
	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext();

		//update the format 
		document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;
		
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1, vadCallBack:createDownloadLink});//, callback: createDownloadLink})

		//start the recording process
		rec.record()

		console.log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
		console.log(err);
    	recordButton.disabled = false;
    	stopButton.disabled = true;
	});
}

function pauseRecording(){
	console.log("pauseButton clicked rec.recording=",rec.recording );
	if (rec.recording){
		//pause
		rec.stop();
		pauseButton.innerHTML="Resume";
	}else{
		//resume
		rec.record()
		pauseButton.innerHTML="Pause";

	}
}

function stopRecording() {
	console.log("stopButton clicked");

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;
	
	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {
	
	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');
	var p_text = document.createElement('h2')

	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString();

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//save to disk link
	link.href = url;
	link.download = filename + ".wav"; //download forces the browser to donwload the file using the  filename
	link.innerHTML = "(download)";

	//add the new audio element to li
	li.appendChild(au);
	
	//add the filename to the li
	//li.appendChild(document.createTextNode(filename + ".wav "))

	//add the save to disk link to li
	//li.appendChild(link);

	var xhr=new XMLHttpRequest();
	xhr.onload=function(e) {
		console.log(e);
		if(this.readyState === 4) {
			var txt = e.target.responseText;
			console.log("Server returned: ", txt);
		
			p_text.appendChild(document.createTextNode (txt));
			
			window.scrollTo(0, document.body.scrollHeight);
		}
	};

	var fd=new FormData();
	fd.append("audio_data",blob, filename);
	fd.append("translate", document.getElementsByName('translate')[0].checked);
	xhr.open("POST","/transcribe",true);
	xhr.send(fd);
	li.appendChild(p_text);
	p_text.appendChild(document.createTextNode ("> "));//add a space in between


	//add the li element to the ol
	recordingsList.appendChild(li);
}