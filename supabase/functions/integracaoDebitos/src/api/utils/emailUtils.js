// src/api/utils/emailUtils.js
import { buscarBoletosProcessadosHoje } from '../repositories/boletosRepository.js';
import { getCurrentDateFormatted } from './dateUtils.js';

export const sendStatusEmail = async () => {
  const successList = await buscarBoletosProcessadosHoje();

  const successTable = successList.map((item) => `
    <tr>
      <td>${getCurrentDateFormatted()}</td>
      <td>${item.dados_boleto.numeroTituloCedenteCobranca}</td>
      <td>${item.dados_boleto.nomeSacadoCobranca}</td>
      <td>${item.dados_boleto.valorAtualTituloCobranca}</td>
    </tr>
  `).join('');

  const emailBody = `
    <h1>Status do Processamento de Pagamentos no Boleto</h1>
    <h2>Registros Processados com Sucesso</h2>
    <table border="1">
      <tr>
        <th>Data Processamento</th>
        <th>ID</th>
        <th>Nome</th>
        <th>Valor</th>          
      </tr>
      ${successTable}
    </table>
  `;

  console.log('Enviando e-mail com status do processamento...');
  console.log(emailBody);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': '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',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: "Financeito Informa",
        email: "financeiro@connectfibrape.com.br"
      },
      to: [
        {
          email: "financeiro@connectfibrape.com.br",
          name: "UpConnect Fibra"
        }
      ],
      subject: "Status do Processamento de Boletos Recebidos",
      htmlContent: emailBody
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to send email:', errorText);
    throw new Error(`Failed to send email: ${errorText}`);
  }

  console.log('E-mail enviado com sucesso!');
};
