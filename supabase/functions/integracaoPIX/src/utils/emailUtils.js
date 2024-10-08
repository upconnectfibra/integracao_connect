export const sendStatusEmail = async (successList, errorList) => {
    const successTable = successList.map((item) => `
      <tr>
        <td>${item.endToEndId}</td>
        <td>${item.nome}</td>
        <td>${item.valor}</td>
      </tr>
    `).join('');
  
    const errorTable = errorList.map((item) => `
      <tr>
        <td>${item.endToEndId}</td>
        <td>${item.nome}</td>
        <td>${item.valor}</td>
        <td>${item.error}</td>
      </tr>
    `).join('');
  
    const emailBody = `
      <h1>Status do Processamento do PIX</h1>
      <h2>Registros Processados com Sucesso</h2>
      <table border="1">
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Valor</th>
        </tr>
        ${successTable}
      </table>
      <h2>Registros com Erro</h2>
      <table border="1">
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Valor</th>
          <th>Erro</th>
        </tr>
        ${errorTable}
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
          name: "Financeiro Informa",
          email: "financeiro@connectfibrape.com.br"
        },
        to: [
          {
            email: "financeiro@connectfibrape.com.br",
            name: "UpConnect Fibra"
          }
        ],
        subject: "Status do Processamento do PIX",
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
  