const config = {
  hosts: {
    bbUrl: 'https://api.bb.com.br',
  },
  oauth: {
    url: 'https://oauth.bb.com.br/oauth/token',
    basicAuth: 'ZXlKcFpDSTZJakpoTkNJc0ltTnZaR2xuYjFCMVlteHBZMkZrYjNJaU9qQXNJbU52WkdsbmIxTnZablIzWVhKbElqbzNNell4Tml3aWMyVnhkV1Z1WTJsaGJFbHVjM1JoYkdGallXOGlPak45OmV5SnBaQ0k2SWpZNE1EVmxNeUlzSW1OdlpHbG5iMUIxWW14cFkyRmtiM0lpT2pBc0ltTnZaR2xuYjFOdlpuUjNZWEpsSWpvM016WXhOaXdpYzJWeGRXVnVZMmxoYkVsdWMzUmhiR0ZqWVc4aU9qTXNJbk5sY1hWbGJtTnBZV3hEY21Wa1pXNWphV0ZzSWpveExDSmhiV0pwWlc1MFpTSTZJbkJ5YjJSMVkyRnZJaXdpYVdGMElqb3hOekU0TURNd01USTVPRE13ZlE=' // Verifique se isso é a string correta codificada em Base64
  },
  credencialBB: {
    gw_app_key: '8b2456c902e61d7a28a02af041fe18f2',
  },
  supabase: {
    pfxUrl: 'https://rjcmhliurwqxzmsfvroh.supabase.co/storage/v1/object/sign/documentos_connect/certificado_digital/Up_Connect_1234.pfx?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJkb2N1bWVudG9zX2Nvbm5lY3QvY2VydGlmaWNhZG9fZGlnaXRhbC9VcF9Db25uZWN0XzEyMzQucGZ4IiwiaWF0IjoxNzIwNDU4NTI5LCJleHAiOjE3NTE5OTQ1Mjl9.ZapfiM9BoRcrQKRkxbAJbVkQDfxPoazfh_TEQUix7OM&t=2024-07-08T17%3A08%3A49.777Z',
    pfxPassword: '1234',
    url: 'https://rjcmhliurwqxzmsfvroh.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY21obGl1cndxeHptc2Z2cm9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyMDEzNTUsImV4cCI6MjAzNTc3NzM1NX0.PjS384RX4fjLfMBqi222HYHNTUQ85qJlquYEQGA8d0k',
  },
  pix: {
    apiUrl: `/pix/v2/pix?gw-app-key=8b2456c902e61d7a28a02af041fe18f2&paginacao.paginaAtual=0&paginacao.itensPorPagina=100&inicio=${getFormattedDateYesterday()}&fim=${getFormattedDateToday()}`,
  },
  omie: {
    appKey: '3705564627765',
    appSecret: 'b1d227f0fd2a58d8f02111a27607c4f3',
    apiUrl: 'https://app.omie.com.br/api/v1',
  }
};

function getFormattedDateYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

function getFormattedDateToday() {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

export { config };
