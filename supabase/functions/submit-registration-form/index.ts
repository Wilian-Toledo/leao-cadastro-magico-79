import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FormSubmissionData {
  // Executive data
  executiveName: string;
  executiveCpf: string;
  executiveRg?: string;
  executiveEmail: string;
  executivePhone?: string;
  
  // Company data
  companyName: string;
  companyCnpj: string;
  companyIe?: string;
  companyIm?: string;
  companyWebsite?: string;
  companyType: string;
  companyActivity: string;
  
  // Contact data
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // Address data
  addressCep: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  
  // Additional address
  hasAdditionalAddress?: boolean;
  additionalCep?: string;
  additionalStreet?: string;
  additionalNumber?: string;
  additionalComplement?: string;
  additionalNeighborhood?: string;
  additionalCity?: string;
  additionalState?: string;
  
  // Banking data
  bankCode?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankPix?: string;
  
  // Commercial data
  commercialReferences?: string;
  
  // Sales segment
  salesSegment?: string[];
  
  // Network data
  networkType?: string;
  networkSize?: string;
  
  // Fiscal data
  fiscalRegime?: string;
  
  // Files
  files?: { [key: string]: File };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Parse form data
    const formData = await req.formData();
    const data: FormSubmissionData = JSON.parse(formData.get("data") as string);

    console.log("Processing form submission for:", data.companyName);

    // Insert form submission into database
    const { data: submission, error: submissionError } = await supabase
      .from("form_submissions")
      .insert({
        executive_name: data.executiveName,
        executive_cpf: data.executiveCpf,
        executive_rg: data.executiveRg,
        executive_email: data.executiveEmail,
        executive_phone: data.executivePhone,
        company_name: data.companyName,
        company_cnpj: data.companyCnpj,
        company_ie: data.companyIe,
        company_im: data.companyIm,
        company_website: data.companyWebsite,
        company_type: data.companyType,
        company_activity: data.companyActivity,
        contact_name: data.contactName,
        contact_phone: data.contactPhone,
        contact_email: data.contactEmail,
        address_cep: data.addressCep,
        address_street: data.addressStreet,
        address_number: data.addressNumber,
        address_complement: data.addressComplement,
        address_neighborhood: data.addressNeighborhood,
        address_city: data.addressCity,
        address_state: data.addressState,
        has_additional_address: data.hasAdditionalAddress,
        additional_cep: data.additionalCep,
        additional_street: data.additionalStreet,
        additional_number: data.additionalNumber,
        additional_complement: data.additionalComplement,
        additional_neighborhood: data.additionalNeighborhood,
        additional_city: data.additionalCity,
        additional_state: data.additionalState,
        bank_code: data.bankCode,
        bank_name: data.bankName,
        bank_agency: data.bankAgency,
        bank_account: data.bankAccount,
        bank_pix: data.bankPix,
        commercial_references: data.commercialReferences,
        sales_segment: data.salesSegment,
        network_type: data.networkType,
        network_size: data.networkSize,
        fiscal_regime: data.fiscalRegime,
      })
      .select()
      .single();

    if (submissionError) {
      console.error("Error inserting submission:", submissionError);
      throw submissionError;
    }

    console.log("Form submission saved with ID:", submission.id);

    // Handle file uploads
    const fileLinks: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        const file = value as File;
        const fileName = `${submission.id}/${key}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from("form-files")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          continue;
        }

        // Save file info to database
        await supabase.from("form_files").insert({
          submission_id: submission.id,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
          field_name: key,
        });

        const { data: urlData } = await supabase.storage
          .from("form-files")
          .createSignedUrl(fileName, 3600 * 24 * 7); // 7 days

        if (urlData) {
          fileLinks.push(`${key}: ${urlData.signedUrl}`);
        }
      }
    }

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .section { margin-bottom: 25px; }
          .section h3 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; color: #555; }
          .value { margin-left: 10px; }
          .files { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Nova Ficha Cadastral Recebida</h2>
            <p><strong>Empresa:</strong> ${data.companyName}</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>

          <div class="section">
            <h3>Dados do Responsável</h3>
            <div class="grid">
              <div class="field"><span class="label">Nome:</span><span class="value">${data.executiveName}</span></div>
              <div class="field"><span class="label">CPF:</span><span class="value">${data.executiveCpf}</span></div>
              <div class="field"><span class="label">RG:</span><span class="value">${data.executiveRg || 'Não informado'}</span></div>
              <div class="field"><span class="label">Email:</span><span class="value">${data.executiveEmail}</span></div>
              <div class="field"><span class="label">Telefone:</span><span class="value">${data.executivePhone || 'Não informado'}</span></div>
            </div>
          </div>

          <div class="section">
            <h3>Dados da Empresa</h3>
            <div class="grid">
              <div class="field"><span class="label">Razão Social:</span><span class="value">${data.companyName}</span></div>
              <div class="field"><span class="label">CNPJ:</span><span class="value">${data.companyCnpj}</span></div>
              <div class="field"><span class="label">IE:</span><span class="value">${data.companyIe || 'Não informado'}</span></div>
              <div class="field"><span class="label">IM:</span><span class="value">${data.companyIm || 'Não informado'}</span></div>
              <div class="field"><span class="label">Website:</span><span class="value">${data.companyWebsite || 'Não informado'}</span></div>
              <div class="field"><span class="label">Tipo:</span><span class="value">${data.companyType}</span></div>
              <div class="field"><span class="label">Atividade:</span><span class="value">${data.companyActivity}</span></div>
            </div>
          </div>

          <div class="section">
            <h3>Endereço Principal</h3>
            <div class="grid">
              <div class="field"><span class="label">CEP:</span><span class="value">${data.addressCep}</span></div>
              <div class="field"><span class="label">Logradouro:</span><span class="value">${data.addressStreet}</span></div>
              <div class="field"><span class="label">Número:</span><span class="value">${data.addressNumber}</span></div>
              <div class="field"><span class="label">Complemento:</span><span class="value">${data.addressComplement || 'Não informado'}</span></div>
              <div class="field"><span class="label">Bairro:</span><span class="value">${data.addressNeighborhood}</span></div>
              <div class="field"><span class="label">Cidade:</span><span class="value">${data.addressCity}</span></div>
              <div class="field"><span class="label">Estado:</span><span class="value">${data.addressState}</span></div>
            </div>
          </div>

          ${data.hasAdditionalAddress ? `
          <div class="section">
            <h3>Endereço Adicional</h3>
            <div class="grid">
              <div class="field"><span class="label">CEP:</span><span class="value">${data.additionalCep || ''}</span></div>
              <div class="field"><span class="label">Logradouro:</span><span class="value">${data.additionalStreet || ''}</span></div>
              <div class="field"><span class="label">Número:</span><span class="value">${data.additionalNumber || ''}</span></div>
              <div class="field"><span class="label">Complemento:</span><span class="value">${data.additionalComplement || 'Não informado'}</span></div>
              <div class="field"><span class="label">Bairro:</span><span class="value">${data.additionalNeighborhood || ''}</span></div>
              <div class="field"><span class="label">Cidade:</span><span class="value">${data.additionalCity || ''}</span></div>
              <div class="field"><span class="label">Estado:</span><span class="value">${data.additionalState || ''}</span></div>
            </div>
          </div>
          ` : ''}

          ${data.contactName ? `
          <div class="section">
            <h3>Contato Alternativo</h3>
            <div class="grid">
              <div class="field"><span class="label">Nome:</span><span class="value">${data.contactName}</span></div>
              <div class="field"><span class="label">Telefone:</span><span class="value">${data.contactPhone || 'Não informado'}</span></div>
              <div class="field"><span class="label">Email:</span><span class="value">${data.contactEmail || 'Não informado'}</span></div>
            </div>
          </div>
          ` : ''}

          ${data.bankName ? `
          <div class="section">
            <h3>Dados Bancários</h3>
            <div class="grid">
              <div class="field"><span class="label">Banco:</span><span class="value">${data.bankName}</span></div>
              <div class="field"><span class="label">Agência:</span><span class="value">${data.bankAgency || 'Não informado'}</span></div>
              <div class="field"><span class="label">Conta:</span><span class="value">${data.bankAccount || 'Não informado'}</span></div>
              <div class="field"><span class="label">PIX:</span><span class="value">${data.bankPix || 'Não informado'}</span></div>
            </div>
          </div>
          ` : ''}

          ${data.salesSegment && data.salesSegment.length > 0 ? `
          <div class="section">
            <h3>Segmento de Vendas</h3>
            <p>${data.salesSegment.join(', ')}</p>
          </div>
          ` : ''}

          ${data.networkType ? `
          <div class="section">
            <h3>Rede de Distribuição</h3>
            <div class="grid">
              <div class="field"><span class="label">Tipo:</span><span class="value">${data.networkType}</span></div>
              <div class="field"><span class="label">Tamanho:</span><span class="value">${data.networkSize || 'Não informado'}</span></div>
            </div>
          </div>
          ` : ''}

          ${data.fiscalRegime ? `
          <div class="section">
            <h3>Regime Fiscal</h3>
            <p>${data.fiscalRegime}</p>
          </div>
          ` : ''}

          ${data.commercialReferences ? `
          <div class="section">
            <h3>Referências Comerciais</h3>
            <p style="white-space: pre-wrap;">${data.commercialReferences}</p>
          </div>
          ` : ''}

          ${fileLinks.length > 0 ? `
          <div class="section">
            <h3>Arquivos Anexados</h3>
            <div class="files">
              ${fileLinks.map(link => `<p>${link}</p>`).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Ficha Cadastral <onboarding@resend.dev>",
      to: ["comercial@example.com"], // Configurar emails da equipe aqui
      subject: `Nova Ficha Cadastral - ${data.companyName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        submissionId: submission.id,
        message: "Ficha cadastral enviada com sucesso!" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-registration-form function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);