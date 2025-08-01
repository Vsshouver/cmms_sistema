import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, render_template, jsonify, send_from_directory
from flask_cors import CORS
from sqlalchemy import text
from datetime import datetime
import os
import sys

# Importar modelos
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
from src.routes.tipos_equipamento import tipos_equipamento_bp
from src.routes.tipos_manutencao import tipos_manutencao_bp
from src.routes.grupos_item import grupos_item_bp
from src.routes.analise_oleo import analise_oleo_bp
from src.routes.importacao import importacao_bp
from src.routes.impressao import impressao_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Chave secreta configurável via variável de ambiente
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key')
app.config['SECRET_KEY'] = SECRET_KEY

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
app.register_blueprint(tipos_equipamento_bp, url_prefix='/api')
app.register_blueprint(tipos_manutencao_bp, url_prefix='/api')
app.register_blueprint(grupos_item_bp, url_prefix='/api')
app.register_blueprint(analise_oleo_bp, url_prefix='/api')
app.register_blueprint(importacao_bp, url_prefix='/api')
app.register_blueprint(impressao_bp, url_prefix='/api')

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
        "version": "2.0.0",
        "endpoints": {
            "auth": "/api/auth/login",
            "dashboard": "/api/dashboard",
            "equipamentos": "/api/equipamentos",
            "ordens_servico": "/api/ordens-servico",
            "estoque": "/api/estoque/pecas",
            "pneus": "/api/pneus",
            "mecanicos": "/api/mecanicos",
            "usuarios": "/api/usuarios",
            "tipos_equipamento": "/api/tipos-equipamento",
            "tipos_manutencao": "/api/tipos-manutencao",
            "grupos_item": "/api/grupos-item",
            "analise_oleo": "/api/analise-oleo",
            "importacao": "/api/importacao/pecas",
            "impressao": "/api/ordens-servico/{id}/imprimir"
        }
    })

@app.route('/api/health')
def health_check():
    """Health check endpoint para monitoramento."""
    try:
        # Verificar conexão com banco de dados
        db.session.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '4.0',
            'database': 'connected'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        }), 503

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
