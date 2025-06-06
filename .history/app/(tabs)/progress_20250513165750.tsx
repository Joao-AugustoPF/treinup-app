import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
import {
  DEFAULT_GYM_ID,
  ProgressService,
  type MetricGroup,
  type MetricType,
} from '@/src/services/progress';
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

// Map de metricType para nome amigável
const METRIC_LABELS: Record<MetricType, string> = {
  weight: 'Peso',
  body_fat_pct: 'Gordura Corporal',
  lean_mass_pct: 'Massa Magra',
  bmi: 'IMC',
  muscle_mass: 'Massa Muscular',
  bone_mass: 'Massa Óssea',
  body_water_pct: 'Água Corporal',
  bmr: 'TMB',
  metabolic_age: 'Idade Metabólica',
  visceral_fat: 'Gordura Visceral',
  waist_circ: 'Circunferência da Cintura',
  hip_circ: 'Circunferência do Quadril',
  wh_ratio: 'Relação Cintura-Quadril',
  chest_circ: 'Circunferência do Peito',
  arm_circ: 'Circunferência do Braço',
  thigh_circ: 'Circunferência da Coxa',
  calf_circ: 'Circunferência da Panturrilha',
  rest_hr: 'Freq. Cardíaca em Repouso',
  bp_systolic: 'Pressão Sistólica',
  bp_diastolic: 'Pressão Diastólica',
  vo2max: 'VO2 Máximo',
  height: 'Altura',
  body_temp: 'Temperatura Corporal',
};

// Map de metricType para unidade
const METRIC_UNITS: Record<MetricType, string> = {
  weight: 'kg',
  body_fat_pct: '%',
  lean_mass_pct: '%',
  bmi: '',
  muscle_mass: '%',
  bone_mass: 'kg',
  body_water_pct: '%',
  bmr: 'kcal',
  metabolic_age: 'anos',
  visceral_fat: '',
  waist_circ: 'cm',
  hip_circ: 'cm',
  wh_ratio: '',
  chest_circ: 'cm',
  arm_circ: 'cm',
  thigh_circ: 'cm',
  calf_circ: 'cm',
  rest_hr: 'bpm',
  bp_systolic: 'mmHg',
  bp_diastolic: 'mmHg',
  vo2max: 'ml/kg/min',
  height: 'cm',
  body_temp: '°C',
};

// Agrupamentos de métricas para exibição na tela
const METRIC_CATEGORIES = {
  composicaoCorporal: [
    'weight',
    'body_fat_pct',
    'lean_mass_pct',
    'muscle_mass',
    'bmi',
  ],
  medidas: [
    'chest_circ',
    'waist_circ',
    'hip_circ',
    'arm_circ',
    'thigh_circ',
    'calf_circ',
  ],
  saude: ['rest_hr', 'bp_systolic', 'bp_diastolic', 'vo2max'],
};

export default function ProgressScreen() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const [metricGroups, setMetricGroups] = useState<MetricGroup[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<
    Record<MetricType, number | undefined>
  >({} as Record<MetricType, number | undefined>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    'composicaoCorporal' | 'medidas' | 'saude'
  >('composicaoCorporal');

  useEffect(() => {
    loadMetrics();
  }, [user]);

  /**
   * Carrega métricas do usuário
   *
   * Na implementação com Appwrite:
   * 1. Obtém o perfil do usuário pelo userId
   * 2. Busca métricas onde memberProfileId = perfil.$id e tenantId = DEFAULT_TENANT_ID
   * 3. Agrupa métricas por data para exibição
   */
  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Definindo a relação correta com Appwrite:
      // - Na implementação real, buscaríamos primeiro o perfil do usuário
      // - Depois buscaríamos as métricas associadas a esse perfil
      // - Cada registro de métrica contém tenantId = DEFAULT_TENANT_ID
      const gymId = DEFAULT_GYM_ID; // Usamos o ID da academia padrão

      const groups = await ProgressService.getMetricsByDate(user, gymId);
      setMetricGroups(groups);

      if (groups.length > 0) {
        const latest = await ProgressService.getLatestMetrics(user, gymId);
        setLatestMetrics(latest);
      }
    } catch (err) {
      setError('Falha ao carregar dados de progresso');
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChange = (metricType: MetricType) => {
    if (metricGroups.length < 2) return '0.0';

    const latest =
      metricGroups[metricGroups.length - 1].metrics[metricType] || 0;
    const previous =
      metricGroups[metricGroups.length - 2].metrics[metricType] || 0;

    if (previous === 0) return '0.0';

    const change = ((latest - previous) / previous) * 100;
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

  // Determina se uma tendência crescente é positiva ou negativa para o tipo de métrica
  const isIncreasePositive = (metricType: MetricType): boolean => {
    // Para algumas métricas, o aumento é negativo (ex: gordura corporal)
    const negativeIncreaseMetrics: MetricType[] = [
      'body_fat_pct',
      'waist_circ',
      'hip_circ',
      'bmi',
      'visceral_fat',
      'rest_hr',
      'bp_systolic',
      'bp_diastolic',
      'body_temp',
      'metabolic_age',
    ];

    return !negativeIncreaseMetrics.includes(metricType);
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
        <TouchableOpacity style={styles.retryButton} onPress={loadMetrics}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preparar as principais métricas para display
  const prepareMainMetrics = () => {
    const metricTypes: { type: MetricType; icon: any }[] = [
      { type: 'weight', icon: Scale },
      { type: 'body_fat_pct', icon: TrendingDown },
      { type: 'muscle_mass', icon: TrendingUp },
      { type: 'bmi', icon: Ruler },
    ];

    return metricTypes.map(({ type, icon }) => ({
      title: METRIC_LABELS[type],
      value:
        latestMetrics[type] !== undefined
          ? `${latestMetrics[type]} ${METRIC_UNITS[type]}`
          : 'N/A',
      change: getChange(type),
      icon,
      inverted: !isIncreasePositive(type),
    }));
  };

  const metrics = prepareMainMetrics();

  // Preparar dados para gráfico de linha (Peso + Gordura)
  const prepareLineChartData = () => {
    const weightData = metricGroups
      .map((group) => {
        const date = new Date(group.date);
        const formattedDate = date.toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        });

        if (group.metrics.weight !== undefined) {
          return {
            value: group.metrics.weight,
            dataPointText: group.metrics.weight.toString(),
            label: formattedDate,
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
          };
        }
        return null;
      })
      .filter(Boolean) as any[];

    const bodyFatData = metricGroups
      .map((group) => {
        const date = new Date(group.date);
        const formattedDate = date.toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        });

        if (group.metrics.body_fat_pct !== undefined) {
          return {
            value: group.metrics.body_fat_pct,
            dataPointText: `${group.metrics.body_fat_pct}%`,
            label: formattedDate,
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
          };
        }
        return null;
      })
      .filter(Boolean) as any[];

    return [...weightData, ...bodyFatData];
  };

  const lineChartData = prepareLineChartData();

  // Preparar dados para gráfico de barras (Volume semanal)
  const barChartData = getWeeklyVolumeData();

  // Preparar dados para o radar/medidas corporais
  const prepareBodyMeasurements = () => {
    if (metricGroups.length < 1) return null;

    const firstGroup = metricGroups[0];
    const latestGroup = metricGroups[metricGroups.length - 1];

    const measurementLabels = [
      'Peito',
      'Cintura',
      'Quadril',
      'Braço',
      'Coxa',
      'Panturrilha',
    ];
    const measurementTypes: MetricType[] = [
      'chest_circ',
      'waist_circ',
      'hip_circ',
      'arm_circ',
      'thigh_circ',
      'calf_circ',
    ];

    return {
      initialValues: measurementTypes.map(
        (type) => firstGroup.metrics[type] ?? 0
      ),
      currentValues: measurementTypes.map(
        (type) => latestGroup.metrics[type] ?? 0
      ),
      labels: measurementLabels,
      types: measurementTypes,
    };
  };

  const bodyMeasurements = prepareBodyMeasurements();

  // Preparar dados para gráfico de torta (Composição corporal)
  const preparePieData = () => {
    if (metricGroups.length === 0) return [];

    const bodyFat = latestMetrics.body_fat_pct ?? 0;
    const leanMass = latestMetrics.lean_mass_pct ?? 100 - bodyFat;

    return [
      {
        value: leanMass,
        color: '#00E6C3',
        text: `${leanMass.toFixed(1)}%`,
        legend: 'Massa Magra',
      },
      {
        value: bodyFat,
        color: '#FF4444',
        text: `${bodyFat.toFixed(1)}%`,
        legend: 'Gordura Corporal',
      },
    ];
  };

  const pieChartData = preparePieData();

  // Preparar dados para as métricas por categoria
  const getCategoryMetrics = (
    category: 'composicaoCorporal' | 'medidas' | 'saude'
  ) => {
    const metricTypes = METRIC_CATEGORIES[category];
    return metricTypes.map((type) => ({
      type: type as MetricType,
      label: METRIC_LABELS[type as MetricType],
      value: latestMetrics[type as MetricType],
      unit: METRIC_UNITS[type as MetricType],
      change: getChange(type as MetricType),
      isPositiveChange:
        Number(getChange(type as MetricType)) > 0
          ? isIncreasePositive(type as MetricType)
          : !isIncreasePositive(type as MetricType),
    }));
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Painel de Progresso</Text>
          <Text style={styles.heroSubtitle}>Acompanhe sua jornada fitness</Text>
        </View>

        <View style={styles.content}>
          {metricGroups.length === 0 ? (
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
                    data={lineChartData.map((d) => ({ value: d.value }))}
                    height={100}
                    width={'100%'}
                    hideRules
                    hideDataPoints
                    noOfSections={0}
                    areaChart // preenche por baixo da linha
                    color="#00E6C3"
                  />
                  {/* <LineChart
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
                          (item) => item && item.dataSet === 2
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
                  /> */}
                </View>
              </View>

              {/* Categorias de Métricas */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Métricas Detalhadas</Text>
                <View style={styles.categoryTabsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.categoryTab,
                      selectedCategory === 'composicaoCorporal' &&
                        styles.categoryTabActive,
                    ]}
                    onPress={() => setSelectedCategory('composicaoCorporal')}
                  >
                    <Text
                      style={[
                        styles.categoryTabText,
                        selectedCategory === 'composicaoCorporal' &&
                          styles.categoryTabTextActive,
                      ]}
                    >
                      Composição
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.categoryTab,
                      selectedCategory === 'medidas' &&
                        styles.categoryTabActive,
                    ]}
                    onPress={() => setSelectedCategory('medidas')}
                  >
                    <Text
                      style={[
                        styles.categoryTabText,
                        selectedCategory === 'medidas' &&
                          styles.categoryTabTextActive,
                      ]}
                    >
                      Medidas
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.categoryTab,
                      selectedCategory === 'saude' && styles.categoryTabActive,
                    ]}
                    onPress={() => setSelectedCategory('saude')}
                  >
                    <Text
                      style={[
                        styles.categoryTabText,
                        selectedCategory === 'saude' &&
                          styles.categoryTabTextActive,
                      ]}
                    >
                      Saúde
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.chartCard}>
                  {getCategoryMetrics(selectedCategory).map((metric) => (
                    <View key={metric.type} style={styles.detailedMetricRow}>
                      <Text style={styles.detailedMetricLabel}>
                        {metric.label}
                      </Text>
                      <Text style={styles.detailedMetricValue}>
                        {metric.value !== undefined
                          ? `${metric.value} ${metric.unit}`
                          : 'N/A'}
                      </Text>
                      <View
                        style={[
                          styles.changeIndicator,
                          {
                            backgroundColor:
                              Number(metric.change) === 0
                                ? '#333'
                                : metric.isPositiveChange
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

              {/* Measurements Visualization */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medidas Corporais</Text>
                <View style={styles.chartCard}>
                  {bodyMeasurements && (
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

                        {bodyMeasurements.labels.map((label, index) => {
                          const initialValue =
                            bodyMeasurements.initialValues[index];
                          const currentValue =
                            bodyMeasurements.currentValues[index];
                          const diff = currentValue - initialValue;
                          const metricType = bodyMeasurements.types[index];
                          const isPositive = isIncreasePositive(metricType);

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
                                        : diff > 0 === isPositive
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
                        {bodyMeasurements.labels.map((label, index) => {
                          const initialValue =
                            bodyMeasurements.initialValues[index];
                          const currentValue =
                            bodyMeasurements.currentValues[index];
                          // Normalize to percentage for visualization
                          const maxValue = Math.max(
                            ...bodyMeasurements.initialValues,
                            ...bodyMeasurements.currentValues
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
                            {latestMetrics.weight !== undefined
                              ? `${latestMetrics.weight}kg`
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
  categoryTabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  categoryTabActive: {
    borderBottomColor: '#00E6C3',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTabTextActive: {
    color: '#00E6C3',
    fontWeight: 'bold',
  },
  detailedMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  detailedMetricLabel: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  detailedMetricValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
});
