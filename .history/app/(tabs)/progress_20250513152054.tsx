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
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

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

  // Mock weekly volume data if needed
  const getWeeklyVolumeData = () => {
    // In a real app, this would calculate from workout history
    const weeks = ['Sem1', 'Sem2', 'Sem3', 'Sem4'];
    return weeks.map((week, index) => ({
      value: Math.floor(Math.random() * 5000) + 5000, // Random values between 5000-10000kg
      label: week,
      frontColor: '#00E6C3',
      topLabelComponent: () => (
        <Text style={{ color: '#ccc', fontSize: 10, marginBottom: 4 }}>
          {Math.floor(Math.random() * 5000) + 5000}kg
        </Text>
      ),
    }));
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

  // Prepare data for Line Chart (Weight + Body Fat)
  const lineChartData = assessments
    .map((assessment) => {
      const date = new Date(assessment.date);
      return [
        {
          value: assessment.weight,
          dataPointText: assessment.weight.toString(),
          label: date.toLocaleDateString('pt-BR', {
            month: 'short',
            year: '2-digit',
          }),
          customDataPoint: () => (
            <View
              style={{
                width: 10,
                height: 10,
                backgroundColor: '#00E6C3',
                borderRadius: 5,
              }}
            />
          ),
        },
        {
          value: assessment.bodyFat,
          dataPointText: `${assessment.bodyFat}%`,
          dataSet: 2,
          customDataPoint: () => (
            <View
              style={{
                width: 10,
                height: 10,
                backgroundColor: '#FF4444',
                borderRadius: 5,
              }}
            />
          ),
        },
      ];
    })
    .flat();

  // Prepare data for Bar Chart (Weekly Volume)
  const barChartData = getWeeklyVolumeData();

  // Prepare data for Polar/Radar Chart (Measurements)
  const prepareRadarData = () => {
    if (assessments.length < 1) return null;

    const firstAssessment = assessments[0];
    const currentAssessment = assessments[assessments.length - 1];

    const measurementLabels = ['Peito', 'Cintura', 'Quadril', 'Bíceps', 'Coxa'];

    return {
      initialValues: [
        firstAssessment.measurements.chest,
        firstAssessment.measurements.waist,
        firstAssessment.measurements.hips,
        firstAssessment.measurements.biceps,
        firstAssessment.measurements.thighs,
      ],
      currentValues: [
        currentAssessment.measurements.chest,
        currentAssessment.measurements.waist,
        currentAssessment.measurements.hips,
        currentAssessment.measurements.biceps,
        currentAssessment.measurements.thighs,
      ],
      labels: measurementLabels,
    };
  };

  const radarData = prepareRadarData();

  // Prepare data for Pie Chart (Body Composition)
  const preparePieData = () => {
    if (!latestAssessment) return [];

    const bodyFat = latestAssessment.bodyFat;
    const leanMass = 100 - bodyFat;

    return [
      {
        value: leanMass,
        color: '#00E6C3',
        text: `${leanMass}%`,
        legend: 'Massa Magra',
      },
      {
        value: bodyFat,
        color: '#FF4444',
        text: `${bodyFat}%`,
        legend: 'Gordura Corporal',
      },
    ];
  };

  const pieChartData = preparePieData();

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

              {/* Line Chart - Weight and Body Fat */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Progresso do Peso e Gordura
                </Text>
                <View style={styles.chartCard}>
                  <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendColor,
                          { backgroundColor: '#00E6C3' },
                        ]}
                      />
                      <Text style={styles.legendText}>Peso (kg)</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendColor,
                          { backgroundColor: '#FF4444' },
                        ]}
                      />
                      <Text style={styles.legendText}>Gordura (%)</Text>
                    </View>
                  </View>
                  <LineChart
                    data={lineChartData}
                    height={200}
                    width={SCREEN_WIDTH - 60}
                    spacing={40}
                    initialSpacing={10}
                    color="#00E6C3"
                    dataPointsColor="#00E6C3"
                    startFillColor="#00E6C3"
                    startOpacity={0.2}
                    endOpacity={0.0}
                    thickness={3}
                    hideDataPoints={false}
                    focusEnabled
                    showYAxisIndices
                    yAxisIndicesHeight={3}
                    yAxisIndicesWidth={SCREEN_WIDTH - 80}
                    showVerticalLines
                    verticalLinesColor="rgba(255,255,255,0.1)"
                    dataSet={[
                      {
                        data: lineChartData.filter(
                          (item) => item.dataSet === 2
                        ),
                        color: '#FF4444',
                        dataPointsColor: '#FF4444',
                        startFillColor: '#FF4444',
                        startOpacity: 0.2,
                        endOpacity: 0.0,
                      },
                    ]}
                    xAxisLabelTextStyle={{ color: '#666', fontSize: 10 }}
                    yAxisTextStyle={{ color: '#666', fontSize: 10 }}
                    hideRules
                    rulesType="solid"
                    rulesColor="rgba(255,255,255,0.1)"
                    yAxisColor="rgba(255,255,255,0.1)"
                    xAxisColor="rgba(255,255,255,0.1)"
                  />
                </View>
              </View>

              {/* Bar Chart - Weekly Volume */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Volume de Treino Semanal
                </Text>
                <View style={styles.chartCard}>
                  <BarChart
                    data={barChartData}
                    barWidth={30}
                    spacing={20}
                    frontColor="#00E6C3"
                    initialSpacing={20}
                    noOfSections={5}
                    height={200}
                    width={SCREEN_WIDTH - 60}
                    maxValue={10000}
                    hideRules={false}
                    yAxisTextStyle={{ color: '#666', fontSize: 10 }}
                    yAxisLabelTexts={['0', '2500', '5000', '7500', '10000']}
                    showYAxisIndices
                    yAxisIndicesColor="rgba(255,255,255,0.1)"
                    yAxisColor="rgba(255,255,255,0.1)"
                    xAxisColor="rgba(255,255,255,0.1)"
                    rulesColor="rgba(255,255,255,0.1)"
                  />
                </View>
              </View>

              {/* Measurements Visualization - Custom Implementation Instead of Radar Chart */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medidas Corporais</Text>
                <View style={styles.chartCard}>
                  {radarData && (
                    <View style={styles.measurementsContainer}>
                      <View style={styles.legendContainer}>
                        <View style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendColor,
                              { backgroundColor: '#00E6C3' },
                            ]}
                          />
                          <Text style={styles.legendText}>Atual</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendColor,
                              { backgroundColor: 'rgba(255, 68, 68, 0.5)' },
                            ]}
                          />
                          <Text style={styles.legendText}>Inicial</Text>
                        </View>
                      </View>

                      {/* Measurements Comparison Table */}
                      <View style={styles.measurementsTable}>
                        <View style={styles.tableHeader}>
                          <Text style={styles.tableHeaderText}>Medida</Text>
                          <Text style={styles.tableHeaderText}>Inicial</Text>
                          <Text style={styles.tableHeaderText}>Atual</Text>
                          <Text style={styles.tableHeaderText}>Dif.</Text>
                        </View>

                        {radarData.labels.map((label, index) => {
                          const initialValue = radarData.initialValues[index];
                          const currentValue = radarData.currentValues[index];
                          const diff = currentValue - initialValue;
                          const isPositive = diff > 0;

                          return (
                            <View key={label} style={styles.tableRow}>
                              <Text style={styles.tableCellText}>{label}</Text>
                              <Text style={styles.tableCellText}>
                                {initialValue} cm
                              </Text>
                              <Text style={styles.tableCellText}>
                                {currentValue} cm
                              </Text>
                              <Text
                                style={[
                                  styles.tableCellDiff,
                                  {
                                    color:
                                      diff === 0
                                        ? '#666'
                                        : label === 'Cintura' ||
                                          label === 'Quadril'
                                        ? isPositive
                                          ? '#FF4444'
                                          : '#00E6C3'
                                        : isPositive
                                        ? '#00E6C3'
                                        : '#FF4444',
                                  },
                                ]}
                              >
                                {diff > 0 ? '+' : ''}
                                {diff.toFixed(1)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>

                      {/* Visual Bar Representation */}
                      <View style={styles.measurementsBars}>
                        {radarData.labels.map((label, index) => {
                          const initialValue = radarData.initialValues[index];
                          const currentValue = radarData.currentValues[index];
                          // Normalize to percentage for visualization
                          const maxValue = Math.max(
                            ...radarData.initialValues,
                            ...radarData.currentValues
                          );
                          const initialPercent =
                            (initialValue / maxValue) * 100;
                          const currentPercent =
                            (currentValue / maxValue) * 100;

                          return (
                            <View
                              key={label}
                              style={styles.measurementBarGroup}
                            >
                              <Text style={styles.measurementBarLabel}>
                                {label}
                              </Text>
                              <View style={styles.measurementBarContainer}>
                                <View
                                  style={[
                                    styles.measurementBar,
                                    {
                                      width: `${initialPercent}%`,
                                      backgroundColor: 'rgba(255, 68, 68, 0.5)',
                                    },
                                  ]}
                                />
                                <View
                                  style={[
                                    styles.measurementBar,
                                    {
                                      width: `${currentPercent}%`,
                                      backgroundColor: '#00E6C3',
                                      marginTop: 4,
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Pie Chart - Body Composition */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Composição Corporal</Text>
                <View style={styles.chartCard}>
                  <View style={styles.pieChartContainer}>
                    <PieChart
                      data={pieChartData}
                      radius={120}
                      showText
                      textColor="#fff"
                      textSize={14}
                      showTextBackground
                      textBackgroundRadius={24}
                      textBackgroundColor="#1a1a1a"
                      focusOnPress
                      centerLabelComponent={() => (
                        <View style={styles.pieChartCenter}>
                          <Text style={styles.pieChartCenterText}>
                            {latestAssessment
                              ? `${latestAssessment.weight}kg`
                              : ''}
                          </Text>
                          <Text style={styles.pieChartCenterSubtext}>
                            Peso Atual
                          </Text>
                        </View>
                      )}
                    />
                  </View>
                  <View style={styles.legendContainer}>
                    {pieChartData.map((item, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: item.color },
                          ]}
                        />
                        <Text style={styles.legendText}>
                          {item.legend}: {item.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
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
    marginBottom: 24, // Increased to 24 as per requirement
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
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: '#666',
    fontSize: 12,
  },
  pieChartContainer: {
    alignItems: 'center',
    height: 260,
  },
  pieChartCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChartCenterText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  pieChartCenterSubtext: {
    color: '#666',
    fontSize: 12,
  },
  measurementsContainer: {
    paddingVertical: 10,
  },
  measurementsTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tableCellText: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  tableCellDiff: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  measurementsBars: {
    marginTop: 15,
  },
  measurementBarGroup: {
    marginBottom: 12,
  },
  measurementBarLabel: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  measurementBarContainer: {
    height: 40,
    justifyContent: 'center',
  },
  measurementBar: {
    height: 16,
    borderRadius: 3,
  },
});
