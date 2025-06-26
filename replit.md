# WhatsApp Campaign Bot - Sistema de Campanhas

## Overview
Sistema completo de campanhas WhatsApp com múltiplas conexões, variações de mensagem, e controle de timing. Migrado de mock para conexões reais WhatsApp Web.js.

## Project Architecture
- **Backend**: Express.js com TypeScript
- **Frontend**: React com Vite
- **Database**: In-Memory Storage (sem PostgreSQL)
- **WhatsApp**: WhatsApp Web.js (real connections)
- **UI**: Tailwind CSS + Radix UI

## Features Implemented
✓ 5 Slots de Conexão WhatsApp - Com QR codes reais
✓ 3 Variações de Mensagem - Suporte a imagens e variáveis
✓ Formato de Contatos - phone,variavel1,variavel2
✓ Sistema de Rotação - Alterna entre contas e mensagens
✓ Mensagens Recebidas - Rastreia respostas de campanhas
✓ Controles de Timing - Intervalos configuráveis
✓ Placeholders Personalizados - {variavel1} e {variavel2}
✓ Dashboard Completo - Interface web completa

## Recent Changes
- **2025-01-23**: Added profile picture detection and display in campaign logs
- **2025-01-23**: Implemented typing simulation to humanize message sending (1-4 seconds)
- **2025-01-23**: System now opens chat and simulates human behavior before sending
- **2025-01-23**: Campaign logs now show profile picture status and humanization info
- **2025-01-23**: Added automatic Brazilian phone number formatting with DDI 55 and digit 9
- **2025-01-23**: System automatically adds country code 55 when missing
- **2025-01-23**: System automatically adds mobile digit 9 for cellular numbers
- **2025-01-23**: Only sends to valid Brazilian WhatsApp numbers
- **2025-01-23**: Added WhatsApp number validation before sending messages
- **2025-01-23**: System now checks if number has WhatsApp before attempting to send
- **2025-01-23**: Invalid numbers are skipped automatically during campaigns
- **2025-01-23**: Fixed EBUSY session cleanup errors that were causing mass disconnections
- **2025-01-23**: Prevented automatic restarts from session cleanup failures
- **2025-01-23**: Disabled session cleanup during disconnection to prevent crashes
- **2025-01-23**: Disabled watchdog auto-recovery to prevent mass disconnections during campaigns
- **2025-01-23**: Fixed individual connection handling to prevent campaign interference
- **2025-01-23**: Fixed second message logic - now properly sends when contact responds
- **2025-01-23**: Fixed automatic disconnection issue - modified watchdog to not interfere with manual connections
- **2025-01-23**: Successfully migrated from Replit Agent to Replit environment
- **2025-06-23**: Fixed WhatsApp service crash issues with improved error handling and timeouts
- **2025-06-23**: Enhanced disconnection handling to prevent file locking errors
- **2025-06-23**: Added robust error recovery for WhatsApp connection failures
- **2025-06-23**: Improved TypeScript type safety in WhatsApp service
- **2025-06-23**: Implemented comprehensive auto-restart system with process manager and watchdog
- **2025-06-23**: Added health monitoring endpoints (/api/health, /api/watchdog/status)
- **2025-06-23**: Created automatic recovery system for WhatsApp connection failures
- **2025-06-23**: Fixed second message logic to send ONLY when contact responds (not automatically)
- **2025-06-23**: Added campaign restart functionality with options to reset progress and clear logs
- **2024-01-25**: Migrated from mock WhatsApp service to real WhatsApp Web.js implementation
- **2024-01-25**: Updated QR code generation to use real WhatsApp QR codes
- **2024-01-25**: Fixed frontend QR code display to handle both data URL formats
- **2024-01-25**: Integrated proper WhatsApp Web client with auth persistence
- **2024-01-25**: Created complete local installation guide (INSTALACAO_LOCAL.md)
- **2024-01-25**: Finalized real WhatsApp service for local deployment
- **2024-01-25**: Created simplified version without database (INSTALACAO_LOCAL_SEM_BD.md)
- **2024-01-25**: Removed PostgreSQL dependency for easier local setup
- **2024-01-25**: Added support for removing images from message variations
- **2024-01-25**: Fixed campaign status display and real-time updates
- **2024-01-25**: Optimized for B2B CSV format with duplicate phones for multiple companies
- **2024-01-25**: Fixed image upload and sending functionality - images now save in root directory
- **2024-01-25**: Corrected phone number formatting to preserve original CSV format without auto-formatting
- **2024-01-25**: Fixed ES modules import error for path and fs in WhatsApp service

## User Preferences
- Language: Portuguese (Brazilian)
- Prefers complete solutions over partial implementations
- Wants real WhatsApp functionality, not mock/demo versions

## Technical Notes
- WhatsApp Web.js uses Puppeteer for browser automation
- LocalAuth strategy for persistent sessions
- QR codes generated as data URLs for display
- WebSocket for real-time updates
- Multer for file uploads (contact CSV, images)