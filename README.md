# Sistema de Palestras e Certificados

Aplicação web para gestão de palestras com inscrição via QR code, envio de certificados por e-mail e validação pública.

## Funcionalidades

- **Administrador**: login, criar palestras (data, horário, local, carga horária)
- **QR Code**: gerado automaticamente com link de inscrição e **data de expiração configurável**
- **Inscrição**: participantes informam nome, CPF, e-mail e telefone
- **Encerramento**: ao encerrar a palestra, todos os inscritos recebem e-mail com link do certificado
- **Certificado PDF**: download com código único de validação
- **Validação pública**: qualquer pessoa pode verificar a autenticidade em `/validar`

## Requisitos

- [Node.js](https://nodejs.org/) 20+ (com npm)

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
copy .env.example .env
# Edite .env com APP_URL, AUTH_SECRET e SMTP (opcional)

# 3. Criar banco e administrador inicial
npm run db:setup

# 4. Iniciar em desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

**Login padrão** (após o seed): `admin@exemplo.com` / `admin123`

## Fluxo de uso

1. Admin faz login em `/admin/login`
2. Cria uma palestra em **Nova palestra** e define **QR code válido até**
3. Na página da palestra, exibe ou imprime o **QR code** para os participantes
4. Participantes escaneiam o QR e se inscrevem (enquanto o QR estiver válido)
5. Após o evento, admin clica em **Encerrar e enviar certificados**
6. Cada inscrito recebe e-mail com link para baixar o PDF
7. Terceiros podem validar o certificado em `/validar` usando o código

## E-mail (SMTP)

Sem SMTP configurado, os e-mails são **simulados no console** do servidor (útil em desenvolvimento).

Para produção, configure no `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Sistema <seu@email.com>"
```

## Estrutura

```
src/
  app/
    admin/          # Painel administrativo
    inscricao/      # Página pública de inscrição (QR)
    certificado/    # Download do certificado
    validar/        # Validação pública
    api/certificado # Geração do PDF
  lib/              # Banco, auth, e-mail, PDF, QR
prisma/             # Schema SQLite e seed
```

## Produção (Apache — palestras.abrarastro.org)

O `index.html` sozinho **não** executa o sistema. É preciso Node.js + proxy reverso no Apache.

### 1. Apache (substitua seu VirtualHost)

```bash
sudo a2enmod proxy proxy_http rewrite headers
sudo cp deploy/apache-palestras.conf /etc/apache2/sites-available/palestras.conf
sudo a2ensite palestras.conf
sudo systemctl reload apache2
```

O arquivo `deploy/apache-palestras.conf` encaminha todo o tráfego de `/` para `http://127.0.0.1:3000` (Next.js).

### 2. Instalar Node.js no servidor (se `npm: command not found`)

```bash
cd /var/www/palestras.abrarastro.org
chmod +x deploy/install-node.sh
sudo ./deploy/install-node.sh
```

### 3. Servidor — deploy do código

```bash
cd /var/www/palestras.abrarastro.org
# envie o projeto (git clone, rsync, etc.)

cp .env.example .env
# Edite .env:
#   APP_URL=https://palestras.abrarastro.org
#   AUTH_SECRET=...
#   DATABASE_URL="file:./prisma/production.db"

chmod +x deploy/install-server.sh
./deploy/install-server.sh
```

### 4. Manter o app rodando (systemd)

```bash
sudo cp deploy/palestras.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now palestras
sudo systemctl status palestras
```

### 5. HTTPS (recomendado)

```bash
sudo certbot --apache -d palestras.abrarastro.org
```

Depois do certificado, use `APP_URL=https://palestras.abrarastro.org` no `.env`.

### Checklist

- `APP_URL` = URL pública (QR codes e e-mails)
- `AUTH_SECRET` forte; troque senha do admin após o seed
- Pasta `prisma/` gravável pelo usuário `www-data` (SQLite)
- SMTP configurado para envio real de certificados
