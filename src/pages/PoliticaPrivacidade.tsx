import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PoliticaPrivacidade = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-6">Última atualização: Abril de 2026</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Introdução</h2>
            <p>
              A <strong>Meu Faturamento App</strong> ("nós", "nosso") valoriza a privacidade dos seus usuários. 
              Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos 
              suas informações pessoais ao utilizar nosso aplicativo e serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Dados Coletados</h2>
            <p className="mb-2">Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome completo, e-mail, telefone e CPF (opcional).</li>
              <li><strong>Dados de uso:</strong> registros de turnos, quilometragem, ganhos, despesas e manutenções de veículos.</li>
              <li><strong>Dados do dispositivo:</strong> tipo de navegador, sistema operacional e endereço IP para fins de segurança.</li>
              <li><strong>Dados de pagamento:</strong> processados diretamente pela plataforma de pagamento (Mercado Pago). Não armazenamos dados de cartão de crédito.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Finalidade do Tratamento</h2>
            <p className="mb-2">Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Fornecer e manter o funcionamento do aplicativo;</li>
              <li>Processar assinaturas e pagamentos;</li>
              <li>Gerar relatórios financeiros personalizados;</li>
              <li>Enviar comunicações importantes sobre o serviço;</li>
              <li>Melhorar a experiência do usuário.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Base Legal (LGPD)</h2>
            <p>
              O tratamento dos seus dados pessoais é realizado em conformidade com a 
              <strong> Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>. 
              As bases legais utilizadas incluem: consentimento do titular, execução de contrato 
              e legítimo interesse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Seus Direitos</h2>
            <p className="mb-2">Como titular dos dados, você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Acessar seus dados pessoais;</li>
              <li>Corrigir dados incompletos ou desatualizados;</li>
              <li>Solicitar a exclusão dos seus dados;</li>
              <li>Revogar o consentimento a qualquer momento;</li>
              <li>Solicitar a portabilidade dos dados.</li>
            </ul>
            <p className="mt-2">
              Para exercer esses direitos, entre em contato pelo e-mail: <strong>contato@bateuameta.com.br</strong> 
              ou pelo WhatsApp: <strong>(12) 98138-7508</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Cookies e Rastreamento</h2>
            <p>
              Utilizamos cookies e tecnologias de rastreamento (como Google Ads e Facebook Pixel) 
              para fins de marketing e análise de desempenho. Esses dados são coletados de forma 
              anônima e não identificam pessoalmente o usuário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Compartilhamento de Dados</h2>
            <p>
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Processadores de pagamento:</strong> para processar as assinaturas realizadas
                através do aplicativo Android, compartilhamos as informações necessárias com o
                <strong> Google Play</strong>, que gerencia as transações de acordo com seus próprios
                termos de serviço e políticas de privacidade. Para pagamentos realizados através do
                nosso site, utilizamos o processador de pagamentos <strong>Mercado Pago</strong>.
                Não armazenamos dados do seu cartão de crédito;
              </li>
              <li>Serviços de hospedagem e infraestrutura (Supabase);</li>
              <li>Quando exigido por lei ou ordem judicial.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados contra 
              acesso não autorizado, perda ou destruição. Isso inclui criptografia, controle 
              de acesso e monitoramento contínuo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Contato</h2>
            <p>
              Em caso de dúvidas sobre esta política, entre em contato:
            </p>
            <ul className="list-none mt-2 space-y-1">
              <li>📧 E-mail: <strong>contato@bateuameta.com.br</strong></li>
              <li>📱 WhatsApp: <strong>(12) 98138-7508</strong></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
