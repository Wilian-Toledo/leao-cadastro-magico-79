import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputMask from "react-input-mask";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, User, Building2, Phone, MapPin, CreditCard, TrendingUp, Target, Network, Receipt } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sendToWebhook } from "@/lib/webhook";
import { z } from "zod";

// Lista de bancos brasileiros
const bancosBrasileiros = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '341', nome: 'Itaú' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '745', nome: 'Citibank' },
  { codigo: '399', nome: 'HSBC' },
  { codigo: '422', nome: 'Safra' },
  { codigo: '655', nome: 'Votorantim' },
  { codigo: '756', nome: 'Sicoob' },
  { codigo: '748', nome: 'Sicredi' },
  { codigo: '041', nome: 'Banrisul' },
  { codigo: '070', nome: 'BRB' },
  { codigo: '085', nome: 'Ailos' },
  { codigo: '260', nome: 'Nu Pagamentos' },
  { codigo: '323', nome: 'Mercado Pago' },
  { codigo: '336', nome: 'C6 Bank' },
  { codigo: '077', nome: 'Inter' },
  { codigo: '380', nome: 'PicPay' },
  { codigo: '290', nome: 'Pagseguro' }
];

const parseBR = (v: unknown): number => {
  const s = String(v ?? "").trim();
  if (!s) return 0;
  return Number(s.replace(/[R$\s.]/g, "").replace(",", "."));
};


const formSchema = z.object({
  // Informações do Executivo
  nomeExecutivo: z.string().min(1, "Nome do executivo é obrigatório"),
  nomeCoordenador: z.string().min(1, "Nome do coordenador é obrigatório"),
  nomeGerente: z.string().min(1, "Nome do gerente é obrigatório"),
  
  // Dados da Empresa
  razaoSocial: z.string().min(1, "Razão social é obrigatória"),
  nomeFantasia: z.string().min(1, "Nome fantasia é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
  inscricaoEstadual: z.string().min(1, "Inscrição estadual é obrigatória"),
  inscricaoMunicipal: z.string().min(1, "Inscrição municipal é obrigatória"),
  
  // Contatos
  nomeResponsavelPrincipal: z.string().min(1, "Nome do responsável principal é obrigatório"),
  telefoneResponsavelPrincipal: z.string().min(1, "Telefone do responsável principal é obrigatório"),
  emailResponsavelPrincipal: z.string().email("Email inválido"),
  
  nomeContatoComercial: z.string().min(1, "Nome do contato comercial é obrigatório"),
  telefoneContatoComercial: z.string().min(1, "Telefone do contato comercial é obrigatório"),
  emailContatoComercial: z.string().email("Email inválido"),
  
  nomeContatoFinanceiro: z.string().min(1, "Nome do contato financeiro é obrigatório"),
  telefoneContatoFinanceiro: z.string().min(1, "Telefone do contato financeiro é obrigatório"),
  emailContatoFinanceiro: z.string().email("Email inválido"),
  
  // Endereço Principal
  cep: z.string().min(8, "CEP deve ter 8 caracteres"),
  numero: z.string().min(1, "Número é obrigatório"),
  rua: z.string().min(1, "Rua é obrigatória"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().min(2, "Estado é obrigatório"),
  complemento: z.string().optional(),
  
  // Endereços Adicionais
  enderecoEntregaIgual: z.enum(["sim", "nao"]),
  enderecoCobrancaIgual: z.enum(["sim", "nao"]),
  
  // Dados Bancários
  banco: z.string().min(1, "Banco é obrigatório"),
  agencia: z.string().min(1, "Agência é obrigatória"),
  conta: z.string().min(1, "Conta é obrigatória"),
  tipoConta: z.string().min(1, "Tipo de conta é obrigatório"),
  
  // Dados Comerciais
  limiteCredito: z.string().min(1, "Limite de crédito é obrigatório"),
  anexos: z.array(z.instanceof(File)).optional().default([]),
  prazoMedioPagamento: z.string().min(1, "Prazo médio de pagamento é obrigatório"),
  faturamentoMensal: z.string().min(1, "Faturamento mensal é obrigatório"),
  tempoAtuacao: z.string().min(1, "Tempo de atuação é obrigatório"),
  
  // Segmento de Vendas
  segmentoVendas: z.array(z.string()).min(1, "Selecione pelo menos um segmento"),
  
  // Redes
  redes: z.array(z.string()).min(1, "Selecione pelo menos uma rede"),
  
  // Dados Fiscais
  regimeTributario: z.string().min(1, "Regime tributário é obrigatório"),
  regimeEspecial: z.enum(["sim", "nao"]),
})
.superRefine((values, ctx) => {
    const limite = parseBR(values.limiteCredito);
    const precisaAnexos = limite >= 50000;

    if (precisaAnexos && (!values.anexos || values.anexos.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["anexos"],
        message:
          "Obrigatório anexar: Balanço Patrimonial, Contrato Social e Faturamento dos últimos 12 meses (para limites ≥ R$ 50.000,00).",
      });
  };
});

type FormData = z.infer<typeof formSchema>;

const FormSection = ({ 
  icon: Icon, 
  title, 
  description, 
  children 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  children: React.ReactNode;
}) => (
  <Card className="mb-6 border-section-border bg-section-bg/50">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-3 text-corporate-orange">
        <Icon className="h-6 w-6" />
        {title}
      </CardTitle>
      <CardDescription className="text-muted-foreground">
        {description}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {children}
    </CardContent>
  </Card>
);

export default function RegistrationForm() {
  // const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [bancoSearch, setBancoSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enderecoData, setEnderecoData] = useState({
    rua: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      segmentoVendas: [],
      redes: [],
      anexos: [],
    },
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
  ];
  const ALLOWED_EXT = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target?.files ?? []);
  
    const valid: File[] = [];
    const rejected: string[] = [];
  
    for (const f of files) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const typeOk = ALLOWED_TYPES.includes(f.type) || ALLOWED_EXT.includes(ext);
      const sizeOk = f.size <= MAX_FILE_SIZE;
  
      if (typeOk && sizeOk) {
        valid.push(f);
      } else {
        const reasons = [
          !typeOk ? "tipo não permitido" : "",
          !sizeOk ? "tamanho acima de 5MB" : "",
        ]
          .filter(Boolean)
          .join(" + ");
        rejected.push(`${f.name} (${reasons})`);
      }
    }
  
    if (rejected.length) {
      toast?.({
        title: "Alguns arquivos foram rejeitados",
        description: rejected.join("\n"),
        variant: "destructive",
      });
      // ou: alert(`Alguns arquivos foram rejeitados:\n${rejected.join("\n")}`);
    }
  
    setUploadedFiles(valid);
    form.setValue("anexos", valid, { shouldValidate: true, shouldDirty: true });
  
    // permite selecionar novamente o mesmo arquivo
    if (e.target) e.target.value = "";
  };

  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // helper para verificar se um array contém um valor (case-insensitive)
      const has = (arr: string[] | undefined, value: string) =>
        Array.isArray(arr) && arr.some(v => v?.toLowerCase() === value.toLowerCase());
  
      // payload completo esperado pelo n8n
      const payload = {
        // 👤 Informações do Executivo
        executivoNome: data.nomeExecutivo,
        coordenadorNome: data.nomeCoordenador,
        gerenteNome: data.nomeGerente,
  
        // 📋 Dados da Empresa
        razaoSocial: data.razaoSocial,
        nomeFantasia: data.nomeFantasia,
        cnpj: data.cnpj,
        inscricaoEstadual: data.inscricaoEstadual,
        inscricaoMunicipal: data.inscricaoMunicipal,
  
        // 📞 Contatos
        contatoPrincipalNome: data.nomeResponsavelPrincipal,
        contatoPrincipalTelefone: data.telefoneResponsavelPrincipal,
        contatoPrincipalEmail: data.emailResponsavelPrincipal,
  
        contatoComercialNome: data.nomeContatoComercial,
        contatoComercialTelefone: data.telefoneContatoComercial,
        contatoComercialEmail: data.emailContatoComercial,
  
        contatoFinanceiroNome: data.nomeContatoFinanceiro,
        contatoFinanceiroTelefone: data.telefoneContatoFinanceiro,
        contatoFinanceiroEmail: data.emailContatoFinanceiro,
  
        // 🏠 Endereço Principal
        enderecoCep: data.cep,
        enderecoNumero: data.numero,
        enderecoRua: data.rua,
        enderecoBairro: data.bairro,
        enderecoCidade: data.cidade,
        enderecoUf: data.estado,
  
        // ❓ Endereços Adicionais
        entregaIgualPrincipal: data.enderecoEntregaIgual === "sim",
        cobrancaIgualPrincipal: data.enderecoCobrancaIgual === "sim",
  
        // 🏦 Dados Bancários
        banco: data.banco,
        agencia: data.agencia,
        conta: data.conta,
        tipoConta: data.tipoConta,
  
        // 💼 Dados Comerciais
        limiteCreditoSolicitado: data.limiteCredito,
        prazoMedioPagamentoDias: data.prazoMedioPagamento,
        faturamentoMensalMedio: data.faturamentoMensal,
        tempoAtuacaoAnos: data.tempoAtuacao,
  
        // 🎯 Segmento de Vendas
        segVarejo: has(data.segmentoVendas, "Varejo"),
        segDistribuidor: has(data.segmentoVendas, "Distribuidor"),
        segAtacado: has(data.segmentoVendas, "Atacado"),
        segKacc: has(data.segmentoVendas, "KACC"),
        segCashCare: has(data.segmentoVendas, "Cash & Care"),
        segCanaisEspeciais: has(data.segmentoVendas, "Canais Especiais"),
  
        // 🏪 Redes
        redeVarejo: has(data.redes, "Varejo"),
        redeDistribuidor: has(data.redes, "Distribuidor"),
  
        // 🧾 Dados Fiscais
        regimeTributario: data.regimeTributario,
        regimeEspecial: data.regimeEspecial === "sim",
  
        // honeypot
        website: ""
      };
  
      const result = await sendToWebhook(payload, uploadedFiles);
  
      if (result?.success === false) {
        throw new Error(result.error || "Erro desconhecido");
      }
  
      toast({
        title: "Formulário enviado com sucesso!",
        description: "Seus dados foram enviados para nossa equipe.",
      });
  
      form.reset()
      setUploadedFiles([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erro ao enviar formulário",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCepChange = async (cep: string, field: any) => {
    field.onChange(cep);
    
    // Remove formatação do CEP
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setEnderecoData({
            rua: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          });
          
          // Atualizar os campos do formulário
          form.setValue('rua', data.logradouro || '');
          form.setValue('bairro', data.bairro || '');
          form.setValue('cidade', data.localidade || '');
          form.setValue('estado', data.uf || '');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const filteredBancos = bancosBrasileiros.filter(banco =>
    banco.nome.toLowerCase().includes(bancoSearch.toLowerCase()) ||
    banco.codigo.includes(bancoSearch)
  );

  const enderecoEntregaValue = form.watch("enderecoEntregaIgual");
  const enderecoCobrancaValue = form.watch("enderecoCobrancaIgual");

  return (
    <div className="min-h-screen bg-gradient-to-br from-corporate-orange-light/20 to-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 bg-primary p-8 rounded-lg text-primary-foreground">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="/lovable-uploads/722b164e-9ff4-4ae3-afab-21b840277c45.png" 
              alt="Leão Alimentos e Bebidas" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">Ficha Cadastral - Pessoa Jurídica</h1>
          <p className="opacity-90">Preencha todos os campos obrigatórios (*) para completar seu cadastro</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações do Executivo */}
            <FormSection
              icon={User}
              title="Informações do Executivo"
              description="Dados do executivo responsável pelo cadastro"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nomeExecutivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Executivo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome do executivo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nomeCoordenador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Coordenador *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome do coordenador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nomeGerente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Gerente *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome do gerente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            {/* Dados da Empresa */}
            <FormSection
              icon={Building2}
              title="Dados da Empresa"
              description="Informações básicas da empresa"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="razaoSocial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite a razão social" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nomeFantasia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Fantasia *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome fantasia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ *</FormLabel>
                      <FormControl>
                        <InputMask
                          mask="99.999.999/9999-99"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          {(inputProps: any) => (
                            <Input 
                              {...inputProps}
                              placeholder="00.000.000/0000-00" 
                            />
                          )}
                        </InputMask>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inscricaoEstadual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inscrição Estadual *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite ISENTO se não possuir" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inscricaoMunicipal"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Inscrição Municipal *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite ISENTO se não possuir" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            {/* Contatos */}
            <FormSection
              icon={Phone}
              title="Contatos"
              description="Informações de contato da empresa"
            >
              {/* Responsável Principal */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-corporate-orange">Responsável Principal:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="nomeResponsavelPrincipal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Responsável Principal *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefoneResponsavelPrincipal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone Principal *</FormLabel>
                        <FormControl>
                          <InputMask
                            mask="(99) 99999-9999"
                            value={field.value}
                            onChange={field.onChange}
                          >
                            {(inputProps: any) => (
                              <Input 
                                {...inputProps}
                                placeholder="(00) 00000-0000" 
                              />
                            )}
                          </InputMask>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emailResponsavelPrincipal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail Principal *</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contato Comercial */}
                <h4 className="text-lg font-semibold text-corporate-orange mt-6">Contato Comercial:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="nomeContatoComercial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Contato Comercial *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefoneContatoComercial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone do Contato Comercial *</FormLabel>
                        <FormControl>
                          <InputMask
                            mask="(99) 99999-9999"
                            value={field.value}
                            onChange={field.onChange}
                          >
                            {(inputProps: any) => (
                              <Input 
                                {...inputProps}
                                placeholder="(00) 00000-0000" 
                              />
                            )}
                          </InputMask>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emailContatoComercial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail do Contato Comercial *</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contato Financeiro */}
                <h4 className="text-lg font-semibold text-corporate-orange mt-6">Contato Financeiro:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="nomeContatoFinanceiro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Contato Financeiro *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefoneContatoFinanceiro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone do Contato Financeiro *</FormLabel>
                        <FormControl>
                          <InputMask
                            mask="(99) 99999-9999"
                            value={field.value}
                            onChange={field.onChange}
                          >
                            {(inputProps: any) => (
                              <Input 
                                {...inputProps}
                                placeholder="(00) 00000-0000" 
                              />
                            )}
                          </InputMask>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emailContatoFinanceiro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail do Contato Financeiro *</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </FormSection>

            {/* Endereço Principal */}
            <FormSection
              icon={MapPin}
              title="Endereço Principal"
              description="Endereço principal da empresa"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP *</FormLabel>
                      <FormControl>
                        <InputMask
                          mask="99999-999"
                          value={field.value}
                          onChange={(e) => handleCepChange(e.target.value, field)}
                        >
                          {(inputProps: any) => (
                            <Input 
                              {...inputProps}
                              placeholder="00000-000" 
                            />
                          )}
                        </InputMask>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número *</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto, Sala, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rua"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rua *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da rua" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado (UF) *</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            {/* Endereços Adicionais */}
            <FormSection
              icon={MapPin}
              title="Endereços Adicionais"
              description="Configure endereços de entrega e cobrança"
            >
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="enderecoEntregaIgual"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>O endereço principal é o mesmo do endereço de entrega? *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="entrega-sim" />
                            <Label htmlFor="entrega-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="entrega-nao" />
                            <Label htmlFor="entrega-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enderecoCobrancaIgual"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>O endereço principal é o mesmo do endereço de cobrança? *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="cobranca-sim" />
                            <Label htmlFor="cobranca-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="cobranca-nao" />
                            <Label htmlFor="cobranca-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Endereço de Entrega */}
                {enderecoEntregaValue === "nao" && (
                  <div className="p-4 border border-corporate-orange-light rounded-lg bg-corporate-orange-light/10">
                    <h4 className="font-semibold text-corporate-orange mb-4">📦 Endereço de Entrega</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="cep-entrega">CEP *</Label>
                          <InputMask mask="99999-999">
                            {(inputProps: any) => (
                              <Input 
                                {...inputProps}
                                id="cep-entrega" 
                                placeholder="00000-000" 
                              />
                            )}
                          </InputMask>
                        </div>
                        <div>
                          <Label htmlFor="numero-entrega">Número *</Label>
                          <Input id="numero-entrega" placeholder="123" />
                        </div>
                        <div>
                          <Label htmlFor="complemento-entrega">Complemento (opcional)</Label>
                          <Input id="complemento-entrega" placeholder="Apto, Sala, etc." />
                        </div>
                        <div>
                          <Label htmlFor="rua-entrega">Rua *</Label>
                          <Input id="rua-entrega" placeholder="Nome da rua" />
                        </div>
                        <div>
                          <Label htmlFor="bairro-entrega">Bairro *</Label>
                          <Input id="bairro-entrega" placeholder="Nome do bairro" />
                        </div>
                        <div>
                          <Label htmlFor="cidade-entrega">Cidade *</Label>
                          <Input id="cidade-entrega" placeholder="Nome da cidade" />
                        </div>
                        <div>
                          <Label htmlFor="estado-entrega">Estado (UF) *</Label>
                          <Input id="estado-entrega" placeholder="SP" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Endereço de Cobrança */}
                {enderecoCobrancaValue === "nao" && (
                  <div className="p-4 border border-corporate-orange-light rounded-lg bg-corporate-orange-light/10">
                    <h4 className="font-semibold text-corporate-orange mb-4">💳 Endereço de Cobrança</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="cep-cobranca">CEP *</Label>
                          <InputMask mask="99999-999">
                            {(inputProps: any) => (
                              <Input 
                                {...inputProps}
                                id="cep-cobranca" 
                                placeholder="00000-000" 
                              />
                            )}
                          </InputMask>
                        </div>
                        <div>
                          <Label htmlFor="numero-cobranca">Número *</Label>
                          <Input id="numero-cobranca" placeholder="123" />
                        </div>
                        <div>
                          <Label htmlFor="complemento-cobranca">Complemento (opcional)</Label>
                          <Input id="complemento-cobranca" placeholder="Apto, Sala, etc." />
                        </div>
                        <div>
                          <Label htmlFor="rua-cobranca">Rua *</Label>
                          <Input id="rua-cobranca" placeholder="Nome da rua" />
                        </div>
                        <div>
                          <Label htmlFor="bairro-cobranca">Bairro *</Label>
                          <Input id="bairro-cobranca" placeholder="Nome do bairro" />
                        </div>
                        <div>
                          <Label htmlFor="cidade-cobranca">Cidade *</Label>
                          <Input id="cidade-cobranca" placeholder="Nome da cidade" />
                        </div>
                        <div>
                          <Label htmlFor="estado-cobranca">Estado (UF) *</Label>
                          <Input id="estado-cobranca" placeholder="SP" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FormSection>

            {/* Dados Bancários */}
            <FormSection
              icon={CreditCard}
              title="Dados Bancários"
              description="Informações bancárias para transações"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="banco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Digite o nome ou número do banco"
                            value={bancoSearch}
                            onChange={(e) => {
                              setBancoSearch(e.target.value);
                              field.onChange(e.target.value);
                            }}
                          />
                          {bancoSearch && filteredBancos.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-corporate-orange-light rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                              {filteredBancos.map((banco) => (
                                <div
                                  key={banco.codigo}
                                  className="p-2 hover:bg-corporate-orange-light/20 cursor-pointer text-sm"
                                  onClick={() => {
                                    const selectedValue = `${banco.codigo} - ${banco.nome}`;
                                    setBancoSearch(selectedValue);
                                    field.onChange(selectedValue);
                                  }}
                                >
                                  <span className="font-medium">{banco.codigo}</span> - {banco.nome}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agência *</FormLabel>
                      <FormControl>
                        <Input placeholder="0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta *</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipoConta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Conta *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de conta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="corrente">Conta Corrente</SelectItem>
                          <SelectItem value="poupanca">Conta Poupança</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            {/* Dados Comerciais */}
            <FormSection
              icon={TrendingUp}
              title="Dados Comerciais"
              description="Informações comerciais da empresa"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="limiteCredito"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de Crédito Solicitado (R$) *</FormLabel>
                      <FormControl>
                        <Input placeholder="50.000,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="anexos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anexos (PDF/DOC/DOCX/PNG/JPG – até 5MB cada)</FormLabel>
                      <FormControl>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            handleFileUpload(e);   // atualiza uploadedFiles e o form.setValue("anexos", ...)
                            field.onBlur();        // marca como touched p/ mostrar erro, se houver
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {parseBR(form.watch("limiteCredito")) >= 50000
                          ? "Obrigatório para limites ≥ R$ 50.000,00: Balanço Patrimonial, Contrato Social e Faturamento dos últimos 12 meses."
                          : "Opcional (torna-se obrigatório se o limite ≥ R$ 50.000,00)."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {uploadedFiles.length > 0 && (
                  <div className="mt-2">
                    <ul className="space-y-1">
                      {uploadedFiles.map((file, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm">
                          <span className="truncate mr-3">{file.name}</span>
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={() => {
                              const arr = [...uploadedFiles];
                              arr.splice(idx, 1);
                              setUploadedFiles(arr);
                              form.setValue("anexos", arr, { shouldValidate: true, shouldDirty: true });
                            }}
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="prazoMedioPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo Médio de Pagamento (dias) *</FormLabel>
                      <FormControl>
                        <Input placeholder="30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="faturamentoMensal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faturamento Mensal Médio (R$) *</FormLabel>
                      <FormControl>
                        <Input placeholder="100.000,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tempoAtuacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo de Atuação no Mercado (anos) *</FormLabel>
                      <FormControl>
                        <Input placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            {/* Segmento de Vendas */}
            <FormSection
              icon={Target}
              title="Segmento de Vendas"
              description="Selecione os segmentos de atuação"
            >
              <FormField
                control={form.control}
                name="segmentoVendas"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        "Varejo",
                        "Distribuidor", 
                        "Atacado",
                        "KACC",
                        "Cash & Care",
                        "Canais Especiais"
                      ].map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="segmentoVendas"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            {/* Redes */}
            <FormSection
              icon={Network}
              title="Redes"
              description="Selecione as redes de atuação"
            >
              <FormField
                control={form.control}
                name="redes"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 gap-4">
                      {["Varejo", "Distribuidor"].map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="redes"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            {/* Dados Fiscais */}
            <FormSection
              icon={Receipt}
              title="Dados Fiscais"
              description="Informações sobre regime tributário"
            >
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="regimeTributario"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Regime Tributário *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="lucro-real" id="lucro-real" />
                            <Label htmlFor="lucro-real">Lucro Real</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="lucro-presumido" id="lucro-presumido" />
                            <Label htmlFor="lucro-presumido">Lucro Presumido</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="simples" id="simples" />
                            <Label htmlFor="simples">SIMPLES</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao-contribuinte" id="nao-contribuinte" />
                            <Label htmlFor="nao-contribuinte">Não Contribuinte ICMS</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="regimeEspecial"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Cliente possui Regime Especial? *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="regime-especial-sim" />
                            <Label htmlFor="regime-especial-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="regime-especial-nao" />
                            <Label htmlFor="regime-especial-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <div className="flex justify-center pt-6">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full md:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Enviar Formulário"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
