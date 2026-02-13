// Tipos do sistema AC Global

export interface Cliente {
    id: string;
    nome: string;
    telefone: string | null;
    email: string | null;
    cpf?: string | null;
    endereco: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ClienteInput {
    nome: string;
    telefone?: string;
    email?: string;
    cpf?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    observacoes?: string;
    empresa_id?: string;
}

export type TipoOrdem = 'instalacao' | 'manutencao' | 'reparo' | 'limpeza';
export type StatusOrdem = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
export type PrioridadeOrdem = 'baixa' | 'normal' | 'alta' | 'urgente';

export interface OrdemServico {
    id: string;
    numero: number;
    empresa_id: string;
    tecnico_id: string | null;
    cliente_id: string;
    cliente?: Cliente;
    tipo: TipoOrdem;
    status: StatusOrdem;
    prioridade: PrioridadeOrdem;
    descricao: string | null;
    equipamento: string | null;
    valor: number | null;
    valor_orcamento?: number | null;
    descricao_orcamento?: string | null;
    data_agendamento: string | null;
    data_conclusao: string | null;
    tecnico_responsavel: string | null;
    observacoes: string | null;
    public_id: string; // ID único para link público
    rastreamento_ativo: boolean;
    tipo_risco_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrdemServicoInput {
    cliente_id: string;
    empresa_id?: string;
    tecnico_id?: string;
    tipo: TipoOrdem;
    status?: StatusOrdem;
    prioridade?: PrioridadeOrdem;
    descricao?: string;
    equipamento?: string;
    valor?: number;
    valor_orcamento?: number;
    descricao_orcamento?: string;
    data_agendamento?: string;
    tecnico_responsavel?: string;
    observacoes?: string;
    rastreamento_ativo?: boolean;
    tipo_risco_id?: string | null;
}

export interface Produto {
    id: string;
    nome: string;
    descricao: string | null;
    preco: number;
    quantidade: number;
    minimo: number;
    unidade: string;
    created_at: string;
    updated_at: string;
}

export interface ProdutoInput {
    nome: string;
    descricao?: string;
    preco: number;
    quantidade: number;
    minimo: number;
    unidade?: string;
}

// Tipos de Usuário e Empresa
export interface Notificacao {
    id: string;
    empresa_id: string;
    perfil_id: string;
    titulo: string;
    mensagem: string;
    tipo: 'os_atribuida' | 'os_cancelada' | 'info';
    lida: boolean;
    link_acao?: string;
    created_at: string;
}

export type UserRole = 'super_admin' | 'admin' | 'tecnico' | 'cliente';

export interface Empresa {
    id: string;
    nome: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    logo_url?: string;
    ativo?: boolean;
}

export interface UserProfile {
    id: string; // auth.uid
    empresa_id: string;
    nome: string;
    email?: string;
    telefone?: string | null;
    cpf?: string | null;
    role: UserRole;
    empresa?: Empresa;
    latitude?: number;
    longitude?: number;
    ultima_localizacao?: string;
    cliente_id?: string;
}

export interface Equipamento {
    id: string;
    empresa_id: string;
    cliente_id: string;
    nome: string;
    marca?: string;
    modelo?: string;
    capacidade?: string;
    tipo?: string;
    numero_serie?: string;
    localizacao?: string;
    data_instalacao?: string;
    ultima_revisao?: string;
    proxima_revisao?: string;
    created_at: string;
    updated_at: string;
}

export interface ServicoPreco {
    id: string;
    empresa_id: string;
    nome: string;
    descricao?: string;
    preco_base: number;
    tempo_estimado_minutos: number;
    ativo: boolean;
}

export interface DailyForecast {
    date: string;
    maxTemp: number;
    minTemp: number;
    condition: string;
}

export interface WeatherData {
    temperature: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    forecast: DailyForecast[];
}

export interface ClimateAlert {
    type: 'heatwave' | 'storm' | 'info' | 'freeze';
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    suggestion: string;
}

// Novos módulos
export interface Contrato {
    id: string;
    empresa_id: string;
    cliente_id: string;
    cliente?: Cliente;
    nome: string;
    valor: number;
    data_inicio: string;
    data_fim?: string;
    dia_vencimento: number;
    ativo: boolean;
    descricao?: string;
}

export interface Fatura {
    id: string;
    empresa_id: string;
    cliente_id: string;
    contrato_id?: string;
    ordem_servico_id?: string;
    descricao: string;
    valor: number;
    data_vencimento: string;
    data_pagamento?: string;
    status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
    cliente?: Cliente;
    contrato?: Contrato;
}

export interface PlanoManutencao {
    id: string;
    empresa_id: string;
    cliente_id: string;
    cliente?: Cliente;
    titulo: string;
    equipamento: string;
    localizacao?: string;
    frequencia_dias: number;
    criado_por?: string;
    ultima_visita?: string;
    proxima_visita?: string;
    ativo: boolean;
}

export type StatusOrcamento = 'pendente' | 'aprovado' | 'rejeitado' | 'concluido';

export interface Orcamento {
    id: string;
    empresa_id: string;
    cliente_id: string;
    cliente?: Cliente;
    descricao: string;
    equipamento: string | null;
    valor: number | null;
    data_inicio: string | null;
    data_fim: string | null;
    status: StatusOrcamento;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrcamentoInput {
    cliente_id: string;
    descricao: string;
    equipamento?: string;
    valor?: number;
    data_inicio?: string;
    data_fim?: string;
    status?: StatusOrcamento;
    observacoes?: string;
}

export interface AuditLog {
    id: string;
    user_id: string;
    empresa_id: string;
    acao: 'INSERT' | 'UPDATE' | 'DELETE';
    tabela: string;
    registro_id: string;
    dados_antigos: any;
    dados_novos: any;
    created_at: string;
    perfil?: {
        nome: string;
    };
    empresa?: {
        nome: string;
    };
}

export interface EventoServico {
    id: string;
    ordem_id: string;
    empresa_id: string;
    tipo: 'chegada' | 'diagnostico' | 'inicio' | 'concluido' | 'pausa' | 'foto_adicionada';
    descricao: string | null;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
}

export interface FotoServico {
    id: string;
    ordem_id: string;
    empresa_id: string;
    url: string;
    tipo: 'antes' | 'diagnostico' | 'progresso' | 'depois' | 'problema' | 'assinatura';
    legenda: string | null;
    created_at: string;
}

// === ESTOQUE ===

export interface EstoqueItem {
    id: string;
    empresa_id: string;
    nome: string;
    descricao?: string;
    unidade: string;
    quantidade: number;
    quantidade_minima: number;
    preco_unitario: number; // Preço de Custo
    preco_venda: number;    // Preço de Venda
    created_at: string;
    updated_at: string;
}

export interface ItemOrcamento {
    id: string;
    empresa_id: string;
    orcamento_id: string;
    item_id?: string;
    nome: string;
    quantidade: number;
    preco_unitario: number;
    total: number;
    created_at: string;
}

export interface MovimentacaoEstoque {
    id: string;
    empresa_id: string;
    item_id: string;
    ordem_id?: string;
    tipo: 'entrada' | 'saida';
    quantidade: number;
    motivo?: string;
    created_at: string;
    usuario_id: string;
}

// === FORNECEDORES E PEDIDOS DE COMPRA ===

export interface Fornecedor {
    id: string;
    empresa_id: string;
    nome: string;
    email?: string;
    telefone?: string;
    cnpj?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    observacoes?: string;
    created_at: string;
    updated_at: string;
}

export type StatusPedidoCompra = 'pendente' | 'enviado' | 'recebido' | 'cancelado';

export interface PedidoCompra {
    id: string;
    empresa_id: string;
    fornecedor_id: string;
    fornecedor?: Fornecedor;
    status: StatusPedidoCompra;
    valor_total: number;
    observacoes?: string;
    created_at: string;
    updated_at: string;
}

export interface ItemPedidoCompra {
    id: string;
    empresa_id: string;
    pedido_id: string;
    nome: string;
    quantidade: number;
    preco_unitario: number;
    total: number;
    created_at: string;
}

// === BASE DE CONHECIMENTO ===

export interface ArtigoConhecimento {
    id: string;
    empresa_id: string;
    autor_id: string;
    autor?: { nome: string }; // Simplified for listing
    titulo: string;
    descricao: string;
    categoria?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface SolucaoConhecimento {
    id: string;
    artigo_id: string;
    autor_id: string;
    autor?: { nome: string }; // Simplified for listing
    conteudo: string;
    votos_positivos: number;
    votos_negativos: number;
    utilidade_score: number;
    created_at: string;
    updated_at: string;
    voto_usuario?: number; // 1, -1 ou undefined (voto do usuário logado)
}

export interface VotoSolucao {
    id: string;
    solucao_id: string;
    usuario_id: string;
    valor: 1 | -1;
    created_at: string;
}

export interface PontuacaoTecnico {
    usuario_id: string;
    usuario?: { nome: string };
    pontos_atuais: number;
    pontos_totais: number;
    contribuicoes_count: number;
    updated_at: string;
}

// === GESTÃO DE QUALIDADE ===

export interface ChecklistQualidade {
    id: string;
    empresa_id: string;
    titulo: string;
    descricao?: string;
    ativo: boolean;
    itens?: ItemChecklist[];
    created_at: string;
    updated_at: string;
}

export interface ItemChecklist {
    id: string;
    checklist_id: string;
    pergunta: string;
    tipo: 'sim_nao' | 'nota' | 'texto';
    ordem: number;
    obrigatorio: boolean;
    created_at: string;
}

export interface RespostaItemChecklist {
    item_id: string;
    pergunta: string;
    tipo: string;
    resposta: string | number | boolean;
    observacao?: string;
}

export interface RespostaChecklist {
    id: string;
    empresa_id: string;
    checklist_id: string;
    checklist?: ChecklistQualidade;
    ordem_servico_id?: string;
    tecnico_id: string;
    tecnico?: { nome: string };
    respostas: RespostaItemChecklist[];
    nota_geral: number;
    observacoes?: string;
    created_at: string;
}

export type StatusAuditoria = 'pendente' | 'aprovado' | 'reprovado' | 'observacao';

export interface Auditoria {
    id: string;
    empresa_id: string;
    ordem_servico_id?: string;
    auditor_id: string;
    auditor?: { nome: string };
    status: StatusAuditoria;
    nota?: number;
    parecer?: string;
    created_at: string;
    updated_at: string;
}

export interface IndicadorQualidade {
    id: string;
    empresa_id: string;
    periodo: string;
    total_servicos: number;
    total_retrabalho: number;
    taxa_retrabalho: number;
    media_satisfacao: number;
    tempo_medio_resolucao: number;
    total_auditorias: number;
    aprovacoes_auditoria: number;
    taxa_aprovacao: number;
    updated_at: string;
}

// === INTEGRAÇÃO FABRICANTES / FORNECEDORES ===

export interface GarantiaEquipamento {
    id: string;
    empresa_id: string;
    fabricante: string;
    modelo: string;
    numero_serie?: string;
    data_compra?: string;
    data_vencimento_garantia: string;
    tipo_garantia: 'padrao' | 'estendida' | 'contratual';
    status: 'ativa' | 'vencida' | 'utilizada';
    observacoes?: string;
    created_at: string;
    updated_at: string;
}

export interface ManualTecnico {
    id: string;
    empresa_id: string;
    fabricante: string;
    modelo?: string;
    titulo: string;
    url_arquivo?: string;
    categoria?: string;
    created_at: string;
}

export interface Cotacao {
    id: string;
    empresa_id: string;
    solicitante_id: string;
    solicitante?: { nome: string };
    titulo: string;
    descricao?: string;
    status: 'aberta' | 'em_analise' | 'finalizada' | 'cancelada';
    data_limite?: string;
    itens?: ItemCotacao[];
    created_at: string;
    updated_at: string;
}

export interface ItemCotacao {
    id: string;
    cotacao_id: string;
    descricao_peca: string;
    quantidade: number;
    unidade: string;
    especificacoes?: string;
    respostas?: RespostaCotacao[];
    created_at: string;
}

export interface RespostaCotacao {
    id: string;
    cotacao_id: string;
    item_cotacao_id: string;
    fornecedor_nome: string;
    preco_unitario?: number;
    prazo_entrega?: number;
    disponibilidade: 'disponivel' | 'sob_encomenda' | 'indisponivel';
    observacoes?: string;
    selecionado: boolean;
    created_at: string;
}

export type StatusPedidoFornecedor = 'pendente' | 'confirmado' | 'em_transito' | 'entregue' | 'cancelado';

export interface PedidoFornecedor {
    id: string;
    empresa_id: string;
    cotacao_id?: string;
    fornecedor_nome: string;
    numero_pedido?: string;
    valor_total: number;
    status: StatusPedidoFornecedor;
    codigo_rastreio?: string;
    previsao_entrega?: string;
    data_entrega?: string;
    observacoes?: string;
    created_at: string;
    updated_at: string;
}

// === PROGRAMA DE FIDELIDADE ===

export interface ProgramaFidelidade {
    id: string;
    empresa_id: string;
    pontos_por_real: number;
    valor_ponto_resgate: number;
    pontos_minimos_resgate: number;
    pontos_por_indicacao: number;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

export interface PontosCliente {
    id: string;
    empresa_id: string;
    cliente_id: string;
    cliente?: Cliente;
    pontos_atuais: number;
    pontos_totais_acumulados: number;
    updated_at: string;
}

export type TipoTransacaoPontos = 'servico_concluido' | 'indicacao' | 'resgate' | 'bonus' | 'ajuste_manual';

export interface TransacaoPontos {
    id: string;
    empresa_id: string;
    cliente_id: string;
    pontos: number;
    tipo: TipoTransacaoPontos;
    referencia_id?: string;
    descricao?: string;
    created_at: string;
    criado_por?: string;
}

export type StatusIndicacao = 'pendente' | 'confirmada' | 'recompensada' | 'cancelada';

export interface Indicacao {
    id: string;
    empresa_id: string;
    indicador_id: string;
    indicador?: Cliente;
    nome_indicado: string;
    contato_indicado?: string;
    status: StatusIndicacao;
    data_conversao?: string;
    created_at: string;
    updated_at: string;
}

export interface DescontoPreventiva {
    id: string;
    empresa_id: string;
    min_manutencoes: number;
    percentual_desconto: number;
    descricao?: string;
    ativo: boolean;
    created_at: string;
}

export interface Resgate {
    id: string;
    empresa_id: string;
    cliente_id: string;
    cliente?: Cliente;
    pontos_utilizados: number;
    valor_desconto_aplicado?: number;
    tipo_resgate: 'desconto' | 'servico_gratuito';
    status: string;
    created_at: string;
}

// === GESTÃO DE RISCOS E CONFORMIDADE ===

export interface Certificacao {
    id: string;
    empresa_id: string;
    nome: string;
    descricao?: string;
    obrigatoria: boolean;
    created_at: string;
    updated_at: string;
}

export interface TecnicoCertificacao {
    id: string;
    empresa_id: string;
    perfil_id: string;
    perfil?: UserProfile;
    certificacao_id: string;
    certificacao?: Certificacao;
    data_emissao: string;
    data_vencimento: string;
    numero_registro?: string;
    documento_url?: string;
    status: 'ativo' | 'vencido' | 'suspenso';
    created_at: string;
    updated_at: string;
}

export interface TipoRisco {
    id: string;
    empresa_id: string;
    nome: string;
    descricao?: string;
    cor_alerta: 'warning' | 'danger';
    certificacoes_requeridas: string[]; // IDs de certificações
    created_at: string;
    updated_at: string;
}

export interface ChecklistSeguranca {
    id: string;
    empresa_id: string;
    tipo_risco_id?: string;
    titulo: string;
    itens: Array<{ pergunta: string; obrigatorio: boolean }>;
    created_at: string;
    updated_at: string;
}

export interface OSSeguranca {
    id: string;
    empresa_id: string;
    os_id: string;
    checklist_id?: string;
    respostas: Record<string, boolean | string>;
    executado_por: string;
    data_execucao: string;
    geolocalizacao?: { latitude: number; longitude: number };
    assinatura_url?: string;
}

// ========== EDUCAÇÃO E GAMIFICAÇÃO ==========

export interface Curso {
    id: string;
    empresa_id: string;
    titulo: string;
    descricao?: string;
    capa_url?: string;
    categoria: string;
    carga_horaria: number;
    xp_recompensa: number;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

export interface Aula {
    id: string;
    curso_id: string;
    ordem: number;
    titulo: string;
    conteudo_tipo: 'video' | 'texto' | 'pdf';
    conteudo_url?: string;
    duracao_estimada: number;
    created_at: string;
}

export interface ProgressoTecnico {
    id: string;
    perfil_id: string;
    aula_id: string;
    concluido: boolean;
    data_conclusao?: string;
    updated_at: string;
}

export interface TecnicoStats {
    perfil_id: string;
    empresa_id: string;
    xp_total: number;
    nivel: number;
    moedas_aprendizado: number;
    cursos_concluidos: number;
    updated_at: string;
}

export interface Badge {
    id: string;
    empresa_id: string;
    nome: string;
    descricao?: string;
    icone: string;
    tipo: string;
    requisito_valor?: number;
    created_at: string;
}

export interface ConquistaTecnico {
    id: string;
    perfil_id: string;
    badge_id: string;
    badge?: Badge;
    conquistado_em: string;
}

// ========== SUSTENTABILIDADE E CONTROLE DE GASES ==========

export interface GasRefrigerante {
    id: string;
    empresa_id: string;
    nome: string;
    gwp: number;
    unidade: string;
    ativo: boolean;
}

export interface CilindroGas {
    id: string;
    empresa_id: string;
    num_serie: string;
    gas_id: string;
    gas?: GasRefrigerante;
    perfil_id?: string;
    perfil?: UserProfile;
    capacidade_total: number;
    peso_atual: number;
    status: 'em_uso' | 'vazio' | 'manutencao';
    created_at: string;
    updated_at: string;
}

export interface RegistroGas {
    id: string;
    empresa_id: string;
    os_id: string;
    cilindro_id: string;
    tipo_operacao: 'carga' | 'recuperacao' | 'descarte_legal';
    quantidade: number;
    co2_equivalente: number;
    foto_balanca_url?: string;
    perfil_id: string;
    created_at: string;
}

export interface EficienciaEquipamento {
    id: string;
    os_id: string;
    consumo_antes?: number;
    consumo_depois?: number;
    melhoria_percentual?: number;
    created_at: string;
}

export interface TecnicoPontosVerde {
    perfil_id: string;
    empresa_id: string;
    pontos_acumulados: number;
    kg_recuperados: number;
    co2_evitado: number;
    updated_at: string;
}

// ========== MARKETPLACE DE FREELANCERS ==========

export interface Freelancer {
    id: string;
    perfil_id: string;
    perfil?: UserProfile;
    empresa_id: string;
    specialties: string[];
    regioes_atendimento: string[];
    documento_identidade?: string;
    dados_bancarios?: {
        banco?: string;
        agencia?: string;
        conta?: string;
        pix?: string;
    };
    avaliacao_media: number;
    total_avaliacoes: number;
    status: 'pendente_aprovacao' | 'ativo' | 'inativo';
    created_at: string;
    updated_at: string;
}

export interface VagaServico {
    id: string;
    empresa_id: string;
    os_id: string;
    os?: OrdemServico;
    titulo: string;
    descricao?: string;
    valor_proposto: number;
    data_prevista: string;
    status: 'aberta' | 'preenchida' | 'cancelada';
    created_at: string;
}

export interface CandidaturaFreelancer {
    id: string;
    vaga_id: string;
    freelancer_id: string;
    freelancer?: Freelancer;
    status: 'candidatado' | 'selecionado' | 'recusado';
    valor_combinado?: number;
    created_at: string;
}

export interface AvaliacaoMkp {
    id: string;
    os_id: string;
    vaga_id: string;
    freelancer_id: string;
    empresa_id: string;
    nota: number;
    comentario?: string;
    created_at: string;
}

export interface PagamentoFreelancer {
    id: string;
    empresa_id: string;
    freelancer_id: string;
    os_id: string;
    valor: number;
    status: 'pendente' | 'processando' | 'pago' | 'rejeitado';
    data_pagamento?: string;
    comprovante_url?: string;
    created_at: string;
}
