from flask import Flask, request, jsonify, send_from_directory, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import sqlite3
import os
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__, static_folder='.', static_url_path='')

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key'  # Change this to a secure key in production
app.config['UPLOAD_FOLDER'] = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}

# Ensure upload directory exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Database initialization
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  email TEXT UNIQUE NOT NULL,
                  password TEXT NOT NULL,
                  bio TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS videos
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  title TEXT NOT NULL,
                  filename TEXT NOT NULL,
                  target_language TEXT NOT NULL,
                  voice_gender TEXT NOT NULL,
                  status TEXT DEFAULT 'processing',
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users (id))''')
    conn.commit()
    conn.close()

init_db()

# Token decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user_id, *args, **kwargs)
    return decorated

# Static file serving
@app.route('/')
def index():
    return send_from_directory('', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('', path)

# Authentication routes
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'message': 'Missing required fields'}), 400

    hashed_password = generate_password_hash(password)
    
    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                 (name, email, hashed_password))
        user_id = c.lastrowid
        conn.commit()
        conn.close()

        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, app.config['SECRET_KEY'])

        return jsonify({
            'token': token,
            'user': {
                'id': user_id,
                'name': name,
                'email': email
            }
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Email already exists'}), 409
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Missing required fields'}), 400

    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('SELECT * FROM users WHERE email = ?', (email,))
        user = c.fetchone()
        conn.close()

        if user and check_password_hash(user[3], password):
            token = jwt.encode({
                'user_id': user[0],
                'exp': datetime.utcnow() + timedelta(days=7)
            }, app.config['SECRET_KEY'])

            return jsonify({
                'token': token,
                'user': {
                    'id': user[0],
                    'name': user[1],
                    'email': user[2]
                }
            }), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# User profile routes
@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('SELECT * FROM users WHERE id = ?', (current_user_id,))
        user = c.fetchone()
        conn.close()

        if user:
            return jsonify({
                'id': user[0],
                'name': user[1],
                'email': user[2],
                'bio': user[4],
                'created_at': user[5]
            }), 200
        else:
            return jsonify({'message': 'User not found'}), 404
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_profile(current_user_id):
    data = request.json
    name = data.get('name')
    bio = data.get('bio')

    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('UPDATE users SET name = ?, bio = ? WHERE id = ?',
                 (name, bio, current_user_id))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Profile updated successfully'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Video routes
@app.route('/api/videos/upload', methods=['POST'])
@token_required
def upload_video(current_user_id):
    if 'video' not in request.files:
        return jsonify({'message': 'No video file provided'}), 400
    
    video = request.files['video']
    title = request.form.get('title')
    target_language = request.form.get('target_language')
    voice_gender = request.form.get('voice_gender')

    if not video or not title or not target_language or not voice_gender:
        return jsonify({'message': 'Missing required fields'}), 400

    if video.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    if not allowed_file(video.filename):
        return jsonify({'message': 'File type not allowed'}), 400

    try:
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{video.filename}"
        video.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('''INSERT INTO videos 
                     (user_id, title, filename, target_language, voice_gender)
                     VALUES (?, ?, ?, ?, ?)''',
                 (current_user_id, title, filename, target_language, voice_gender))
        video_id = c.lastrowid
        conn.commit()
        conn.close()

        return jsonify({
            'id': video_id,
            'title': title,
            'status': 'processing'
        }), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/videos', methods=['GET'])
@token_required
def get_videos(current_user_id):
    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute('''SELECT id, title, target_language, status, created_at 
                     FROM videos WHERE user_id = ? 
                     ORDER BY created_at DESC''', (current_user_id,))
        videos = c.fetchall()
        conn.close()

        return jsonify([{
            'id': video[0],
            'title': video[1],
            'target_language': video[2],
            'status': video[3],
            'created_at': video[4]
        } for video in videos]), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

if __name__ == '__main__':
    app.run(debug=True)
