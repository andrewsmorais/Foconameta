import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermosDeUso = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
        <p className="text-muted-foreground mb-6">Última atualização: Abril de 2026</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o aplicativo <strong>Meu Faturamento App</strong>, você concorda com 
              estes Termos de Uso. Caso não concorde com algum dos termos, não utilize o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Descrição do Serviço</h2>
            <p>
              O Meu Faturamento App é um aplicativo de controle financeiro desenvolvido para motoristas 
              de aplicativos. O serviço permite registrar turnos, quilometragem, ganhos, despesas, 
              manutenções de veículos e acompanhar metas financeiras.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Cadastro e Conta</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Você é responsável por manter a confidencialidade da sua senha;</li>
              <li>As informações fornecidas devem ser verdadeiras e atualizadas;</li>
              <li>Cada conta é pessoal e intransferível;</li>
              <li>Você é responsável por todas as atividades realizadas na sua conta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Planos e Assinatura</h2>
            <p>
              O Meu Faturamento App oferece planos de assinatura com diferentes períodos. 
              O acesso às funcionalidades do aplicativo está condicionado à manutenção 
              de uma assinatura ativa.
            </p>
            <p className="mt-2">
              As assinaturas podem ser adquiridas diretamente em nosso site, com o pagamento
              processado pelo <strong>Mercado Pago</strong>, ou dentro do nosso aplicativo Android,
              através do sistema de faturamento do <strong>Google Play</strong>. Ao assinar pelo
              Google Play, você concorda com os termos de faturamento da plataforma.
            </p>
          </section>

          <section id="reembolso">
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Política de Reembolso</h2>
            <p>
              <strong>Para compras realizadas em nosso site:</strong> você tem direito a
              <strong> reembolso total em até 7 (sete) dias</strong> a contar da data da compra,
              conforme garantido pelo <strong>Código de Defesa do Consumidor (Art. 49)</strong>.
              Para solicitar o reembolso, entre em contato pelo WhatsApp
              <strong> (12) 98138-7508</strong> ou pelo e-mail
              <strong> contato@bateuameta.com.br</strong>. Após o período de 7 dias, não será
              possível solicitar reembolso, exceto em casos previstos por lei.
            </p>
            <p className="mt-2">
              <strong>Para assinaturas feitas pelo Google Play:</strong> o processo de reembolso é
              gerenciado diretamente pelo Google. Você deve solicitar o reembolso através do seu
              histórico de compras na <strong>Google Play Store</strong>, de acordo com as
              políticas e prazos estabelecidos pela própria plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Responsabilidades do Usuário</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilizar o aplicativo de forma lícita e ética;</li>
              <li>Não tentar acessar áreas restritas do sistema;</li>
              <li>Não utilizar o serviço para fins ilegais;</li>
              <li>Manter seus dados de acesso em sigilo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Limitação de Responsabilidade</h2>
            <p>
              O Meu Faturamento App é uma ferramenta de auxílio ao controle financeiro. 
              Não nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Decisões financeiras tomadas com base nos dados do aplicativo;</li>
              <li>Indisponibilidade temporária do serviço por manutenção ou falhas técnicas;</li>
              <li>Perda de dados causada por uso indevido ou falha do dispositivo do usuário.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo do aplicativo, incluindo design, textos, logotipos e funcionalidades, 
              é de propriedade exclusiva do Meu Faturamento App e está protegido por leis de direitos autorais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Modificações</h2>
            <p>
              Reservamo-nos o direito de alterar estes Termos de Uso a qualquer momento. 
              As alterações serão comunicadas através do aplicativo ou por e-mail. O uso 
              continuado do serviço após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Contato</h2>
            <p>
              Em caso de dúvidas sobre estes termos, entre em contato:
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

export default TermosDeUso;
