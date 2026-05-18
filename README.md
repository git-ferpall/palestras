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

## Produção

- Altere `APP_URL` para o domínio real (usado nos QR codes e links de e-mail)
- Use um `AUTH_SECRET` forte
- Troque a senha do administrador
- Considere PostgreSQL em vez de SQLite (`provider = "postgresql"` no Prisma)

```bash
npm run build
npm start
```
