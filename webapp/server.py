#!/usr/bin/python3
import whisper
from whisper.decoding import DecodingTask
import threading 

from flask import Flask, request, flash, redirect, render_template, Response
from werkzeug.utils import secure_filename

import logging
import os
import time
import uuid
import torch


model = whisper.load_model("./small.pt", device="cuda" if torch.cuda.is_available() else "cpu")
translate_opt = whisper.DecodingOptions(task="translate", fp16=torch.cuda.is_available())
transcribe_opt = whisper.DecodingOptions(fp16=torch.cuda.is_available())

transcription_task = DecodingTask(model, transcribe_opt)
translation_task = DecodingTask(model, translate_opt)

app = Flask(__name__)
app.logger.setLevel(logging.INFO)

UPLOADS_FOLDER = '/tmp'
app.config['UPLOAD_FOLDER'] = UPLOADS_FOLDER

@app.route("/")
def hello(name=None):
    return render_template('index.html')

sem = threading.Semaphore()

@app.route('/transcribe', methods=['POST'])
def transcribe_file():
    if request.method == 'POST':
        translate_str = request.form.get('translate', 'false')
        translate = translate_str.lower() in ['true', 'yes', '1']
        # check if the post request has the file part
        if 'audio_data' not in request.files:
            return "no file part"
        file = request.files['audio_data']
        if file.content_type != 'audio/wav':
            return "only audio/wav content type is supported"

        # create a filename variable with a random uuid string
        filename = str(uuid.uuid4()) + '.wav'
        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(path)

        sem.acquire()

        audio = whisper.load_audio(path)
        audio = whisper.pad_or_trim(audio)
        mel = whisper.log_mel_spectrogram(audio).to(model.device)
        os.remove(path)

        
        if mel.ndim == 2:
            mel = mel.unsqueeze(0)
        
        task = translation_task if translate else transcription_task
        result = task.run(mel)[0]
        sem.release()

        text = result.text
        app.logger.info("result %s no_speech_prob: %f", result.text, result.no_speech_prob)
        if result.no_speech_prob > 0.5:
            text = "** No speech detected **"
        return text

@app.route('/liveness')
def liveness():
  return "OK"

@app.route('/readiness')
def readyness():
  return "OK"
