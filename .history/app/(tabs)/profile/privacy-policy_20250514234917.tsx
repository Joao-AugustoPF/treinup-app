import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Política de Privacidade</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Informações que Coletamos</Text>
          <Text style={styles.text}>
            Coletamos informações que você nos fornece diretamente, incluindo:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              • Informações pessoais (nome, endereço de email, número de
              telefone)
            </Text>
            <Text style={styles.listItem}>
              • Informações do perfil (fotos, informações biográficas)
            </Text>
            <Text style={styles.listItem}>
              • Dados de fitness e saúde (histórico de treinos, medidas físicas)
            </Text>
            <Text style={styles.listItem}>
              • Informações do dispositivo e uso
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. Como Usamos Suas Informações
          </Text>
          <Text style={styles.text}>
            Usamos as informações que coletamos para:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              • Fornecer, manter e melhorar nossos serviços
            </Text>
            <Text style={styles.listItem}>• Processar suas transações</Text>
            <Text style={styles.listItem}>
              • Enviar avisos técnicos e mensagens de suporte
            </Text>
            <Text style={styles.listItem}>
              • Comunicar sobre produtos, serviços e eventos
            </Text>
            <Text style={styles.listItem}>
              • Monitorar e analisar tendências e uso
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. Compartilhamento de Informações
          </Text>
          <Text style={styles.text}>
            Não compartilhamos suas informações pessoais com terceiros, exceto:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Com seu consentimento</Text>
            <Text style={styles.listItem}>
              • Para cumprir obrigações legais
            </Text>
            <Text style={styles.listItem}>
              • Para proteger nossos direitos e prevenir fraudes
            </Text>
            <Text style={styles.listItem}>
              • Com provedores de serviços que auxiliam nossas operações
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Segurança dos Dados</Text>
          <Text style={styles.text}>
            Tomamos medidas razoáveis para ajudar a proteger suas informações
            pessoais contra perda, roubo, uso indevido, acesso não autorizado,
            divulgação, alteração e destruição. No entanto, nenhum sistema de
            segurança é impenetrável e não podemos garantir a segurança de
            nossos sistemas em 100%.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Seus Direitos</Text>
          <Text style={styles.text}>Você tem o direito de:</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>
              • Acessar suas informações pessoais
            </Text>
            <Text style={styles.listItem}>
              • Corrigir informações imprecisas ou incompletas
            </Text>
            <Text style={styles.listItem}>
              • Solicitar a exclusão de suas informações
            </Text>
            <Text style={styles.listItem}>
              • Optar por não receber comunicações de marketing
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Alterações nesta Política</Text>
          <Text style={styles.text}>
            Podemos atualizar esta política de privacidade periodicamente.
            Notificaremos você sobre quaisquer alterações publicando a nova
            política de privacidade nesta página e atualizando a data de "Última
            Atualização" abaixo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Entre em Contato</Text>
          <Text style={styles.text}>
            Se você tiver alguma dúvida sobre esta política de privacidade ou
            nossas práticas, entre em contato conosco:
          </Text>
          <Text style={styles.contactInfo}>
            Email: privacy@example.com{'\n'}
            Telefone: +1 (555) 123-4567{'\n'}
            Endereço: 123 Privacy Street, New York, NY 10001
          </Text>
        </View>

        <Text style={styles.lastUpdated}>
          Última Atualização: 20 de Fevereiro de 2024
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    color: '#fff',
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 10,
  },
  list: {
    marginLeft: 10,
    marginTop: 10,
  },
  listItem: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginTop: 10,
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
});
