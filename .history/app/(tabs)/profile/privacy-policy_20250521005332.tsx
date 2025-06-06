import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { paperTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: paperTheme.colors.surface }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={paperTheme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>
          Política de Privacidade
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
            1. Informações que Coletamos
          </Text>
          <Text style={[styles.text, { color: paperTheme.colors.onSurfaceVariant }]}>
            Coletamos informações que você nos fornece diretamente, incluindo:
          </Text>
          <View style={styles.list}>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Informações pessoais (nome, endereço de email, número de
              telefone)
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Informações do perfil (fotos, informações biográficas)
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Dados de fitness e saúde (histórico de treinos, medidas físicas)
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Informações do dispositivo e uso
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
            2. Como Usamos Suas Informações
          </Text>
          <Text style={[styles.text, { color: paperTheme.colors.onSurfaceVariant }]}>
            Usamos as informações que coletamos para:
          </Text>
          <View style={styles.list}>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Fornecer, manter e melhorar nossos serviços
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Processar suas transações
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Enviar avisos técnicos e mensagens de suporte
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Comunicar sobre produtos, serviços e eventos
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Monitorar e analisar tendências e uso
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
            3. Compartilhamento de Informações
          </Text>
          <Text style={[styles.text, { color: paperTheme.colors.onSurfaceVariant }]}>
            Não compartilhamos suas informações pessoais com terceiros, exceto:
          </Text>
          <View style={styles.list}>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Com seu consentimento
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Para cumprir obrigações legais
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Para proteger nossos direitos e prevenir fraudes
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Com provedores de serviços que auxiliam nossas operações
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
            4. Segurança dos Dados
          </Text>
          <Text style={[styles.text, { color: paperTheme.colors.onSurfaceVariant }]}>
            Tomamos medidas razoáveis para ajudar a proteger suas informações
            pessoais contra perda, roubo, uso indevido, acesso não autorizado,
            divulgação, alteração e destruição. No entanto, nenhum sistema de
            segurança é impenetrável e não podemos garantir a segurança de
            nossos sistemas em 100%.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
            5. Seus Direitos
          </Text>
          <Text style={[styles.text, { color: paperTheme.colors.onSurfaceVariant }]}>
            Você tem o direito de:
          </Text>
          <View style={styles.list}>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Acessar suas informações pessoais
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Corrigir informações imprecisas ou incompletas
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Solicitar a exclusão de suas informações
            </Text>
            <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>
              • Optar por não receber comunicações de marketing
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
            6. Alterações nesta Política
          </Text>
          <Text style={[styles.text, { color: paperTheme.colors.onSurfaceVariant }]}>
            Podemos atualizar esta política de privacidade periodicamente.
            Notificaremos você sobre quaisquer alterações publicando a nova
            política de privacidade nesta página e atualizando a data de &quot;Última
            Atualização&quot; abaixo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
            7. Entre em Contato
          </Text>
          <Text style={[styles.text, { color: paperTheme.colors.onSurfaceVariant }]}>
            Se você tiver alguma dúvida sobre esta política de privacidade ou
            nossas práticas, entre em contato conosco:
          </Text>
          <Text style={[styles.contactInfo, { 
            color: paperTheme.colors.onSurfaceVariant,
            backgroundColor: paperTheme.colors.surfaceVariant 
          }]}>
            Email: privacy@example.com{'\n'}
            Telefone: +1 (555) 123-4567{'\n'}
            Endereço: 123 Privacy Street, New York, NY 10001
          </Text>
        </View>

        <Text style={[styles.lastUpdated, { color: paperTheme.colors.onSurfaceVariant }]}>
          Última Atualização: 20 de Fevereiro de 2024
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  list: {
    marginLeft: 10,
    marginTop: 10,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    padding: 15,
    borderRadius: 8,
  },
  lastUpdated: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
});
