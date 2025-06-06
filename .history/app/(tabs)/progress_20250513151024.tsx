import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
import { ProgressService, type Assessment } from '@/src/services/progress';
import { Ruler, Scale, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const COLORS = ['#00E6C3', '#FF4444', '#FFD93D', '#6C5CE7'];

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProgressScreen() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentGym) {
      loadAssessments();
    }
  }, [user, currentGym]);

  const loadAssessments = async () => {
    if (!currentGym) {
      setError('Por favor, selecione uma academia nas configurações do perfil');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await ProgressService.getUserAssessments(
        user,
        currentGym.id
      );
      setAssessments(data);
    } catch (err) {
      setError('Falha ao carregar dados de progresso');
      console.error('Error loading assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChange = (
    current: number | undefined,
    previous: number | undefined
  ) => {
    if (!current || !previous) return '0.0';
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#00E6C3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAssessments}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const latestAssessment = assessments[assessments.length - 1];
  const previousAssessment = assessments[assessments.length - 2];

  const metrics = [
    {
      title: 'Peso',
      value: latestAssessment ? `${latestAssessment.weight} kg` : 'N/A',
      change: getChange(latestAssessment?.weight, previousAssessment?.weight),
      icon: Scale,
    },
    {
      title: 'Gordura Corporal',
      value: latestAssessment ? `${latestAssessment.bodyFat}%` : 'N/A',
      change: getChange(latestAssessment?.bodyFat, previousAssessment?.bodyFat),
      icon: TrendingDown,
      inverted: true,
    },
    {
      title: 'Massa Muscular',
      value: latestAssessment ? `${latestAssessment.muscleMass}%` : 'N/A',
      change: getChange(
        latestAssessment?.muscleMass,
        previousAssessment?.muscleMass
      ),
      icon: TrendingUp,
    },
    {
      title: 'IMC',
      value: latestAssessment ? latestAssessment.bmi.toFixed(1) : 'N/A',
      change: getChange(latestAssessment?.bmi, previousAssessment?.bmi),
      icon: Ruler,
    },
  ];

  let Charts = null;
  // if (Platform.OS === 'web') {
  //   const {
  //     LineChart,
  //     Line,
  //     XAxis,
  //     YAxis,
  //     CartesianGrid,
  //     Tooltip,
  //     ResponsiveContainer,
  //     AreaChart,
  //     Area,
  //     PieChart,
  //     Pie,
  //     Cell,
  //   } = require('recharts');

    const weightData = assessments.map((assessment) => ({
      date: new Date(assessment.date).toLocaleDateString('pt-BR', {
        month: 'short',
        day: 'numeric',
      }),
      weight: assessment.weight,
    }));

    const bodyCompositionData = assessments.map((assessment) => ({
      date: new Date(assessment.date).toLocaleDateString('pt-BR', {
        month: 'short',
        day: 'numeric',
      }),
      bodyFat: assessment.bodyFat,
      muscleMass: assessment.muscleMass,
    }));

    const measurementsData = latestAssessment
      ? [
          { name: 'Peito', value: latestAssessment.measurements.chest },
          { name: 'Cintura', value: latestAssessment.measurements.waist },
          { name: 'Quadril', value: latestAssessment.measurements.hips },
          { name: 'Bíceps', value: latestAssessment.measurements.biceps },
        ]
      : [];

    Charts =
      assessments.length > 0 ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progresso do Peso</Text>
            <View style={styles.chartCard}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={weightData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="weightGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#00E6C3" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00E6C3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#00E6C3"
                    fillOpacity={1}
                    fill="url(#weightGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Composição Corporal</Text>
            <View style={styles.chartCard}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={bodyCompositionData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bodyFat"
                    stroke="#FF4444"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="muscleMass"
                    stroke="#00E6C3"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medidas Corporais</Text>
            <View style={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={measurementsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }: { name: string; value: number }) =>
                      `${name}: ${value}cm`
                    }
                  >
                    {measurementsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            Nenhum dado de avaliação disponível
          </Text>
        </View>
      );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Painel de Progresso</Text>
          <Text style={styles.heroSubtitle}>Acompanhe sua jornada fitness</Text>
        </View>

        <View style={styles.content}>
          {assessments.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                Nenhum dado de avaliação disponível
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.metricsGrid}>
                {metrics.map((metric) => (
                  <View key={metric.title} style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <metric.icon size={24} color="#00E6C3" />
                      <Text style={styles.metricTitle}>{metric.title}</Text>
                    </View>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                    <View
                      style={[
                        styles.changeIndicator,
                        {
                          backgroundColor:
                            Number(metric.change) === 0
                              ? '#333'
                              : metric.inverted
                              ? Number(metric.change) > 0
                                ? '#FF4444'
                                : '#00E6C3'
                              : Number(metric.change) > 0
                              ? '#00E6C3'
                              : '#FF4444',
                        },
                      ]}
                    >
                      <Text style={styles.changeText}>
                        {Number(metric.change) > 0 ? '+' : ''}
                        {metric.change}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {Platform.OS === 'web' ? (
                Charts
              ) : (
                <View style={styles.mobileMessage}>
                  <Text style={styles.mobileMessageText}>
                    Gráficos detalhados disponíveis na versão web
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#1a1a1a',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: (Platform.OS === 'web' ? 300 : SCREEN_WIDTH - 50) / 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  changeIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    height: 300,
  },
  mobileMessage: {
    padding: 20,
    alignItems: 'center',
  },
  mobileMessageText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#00E6C3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
