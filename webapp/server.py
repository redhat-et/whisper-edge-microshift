#!/usr/bin/python3
import whisper

from flask import Flask, request, flash, redirect, render_template, Response
from werkzeug.utils import secure_filename

import logging
import os
import time
import uuid
import torch


model = whisper.load_model("./small.pt", device="cuda" if torch.cuda.is_available() else "cpu")
options = whisper.DecodingOptions(task="translate", fp16=torch.cuda.is_available())


app = Flask(__name__)
app.logger.setLevel(logging.INFO)

UPLOADS_FOLDER = '/tmp'
app.config['UPLOAD_FOLDER'] = UPLOADS_FOLDER

@app.route("/")
def hello(name=None):
    return render_template('index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe_file():
    if request.method == 'POST':
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

        audio = whisper.load_audio(path)
        audio = whisper.pad_or_trim(audio)
        mel = whisper.log_mel_spectrogram(audio).to(model.device)
        result = whisper.decode(model, mel, options)
        return result.text
        
