import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from src.models.usuario import db

# Importar blueprints
from src.routes.auth import auth_bp
from src.routes.dashboard import dashboard_bp
from src.routes.equipamentos import equipamentos_bp
from src.routes.ordens_servico import ordens_servico_bp
from src.routes.estoque import estoque_bp
from src.routes.pneus import pneus_bp
from src.routes.mecanicos import mecanicos_bp
from src.routes.usuarios import usuarios_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Configurar CORS para permitir credenciais de qualquer origem
FRONTEND_URL = os.environ.get('FRONTEND_URL', '')
CORS(app, supports_credentials=True, origins=[FRONTEND_URL] if FRONTEND_URL else "*")

# Registrar blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(equipamentos_bp, url_prefix='/api')
app.register_blueprint(ordens_servico_bp, url_prefix='/api')
app.register_blueprint(estoque_bp, url_prefix='/api')
app.register_blueprint(pneus_bp, url_prefix='/api')
app.register_blueprint(mecanicos_bp, url_prefix='/api')
app.register_blueprint(usuarios_bp, url_prefix='/api')

# Configurar banco de dados PostgreSQL
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Railway PostgreSQL
    print(f"🐘 Conectando ao PostgreSQL: {database_url[:50]}...")
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # Fallback para SQLite local (desenvolvimento)
    print("🗄️ Usando SQLite local para desenvolvimento...")
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Rotas para servir arquivos estáticos do frontend
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, "index.html")
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, "index.html")
        else:
            return "index.html not found", 404

# Healthcheck endpoint
@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200

# API index for discovery
@app.route("/api", methods=["GET"])
def api_index():
    return jsonify({
        "message": "CMMS API funcionando",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth/login",
            "dashboard": "/api/dashboard",
            "equipamentos": "/api/equipamentos",
            "ordens_servico": "/api/ordens-servico",
            "estoque": "/api/estoque/pecas",
            "pneus": "/api/pneus",
            "mecanicos": "/api/mecanicos",
            "usuarios": "/api/usuarios"
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🌐 Servidor CMMS rodando na porta {port}")
    
    # Criar tabelas se não existirem e popular dados de exemplo
    with app.app_context():
        db.create_all()
        print("✅ Tabelas do banco de dados criadas/verificadas")
        
        # Importar e chamar a função de criação de dados de exemplo
        from init_db import criar_dados_exemplo
        criar_dados_exemplo()
    
    app.run(host='0.0.0.0', port=port, debug=False)
