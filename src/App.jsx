import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calculator, Upload, Download, BarChart3, Leaf, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Papa from 'papaparse'
import './App.css'

// MEREC Algorithm Implementation (Fixed)
function calculateMEREC(decisionMatrix, criteriaTypes) {
  const m = decisionMatrix.length; // number of alternatives
  const n = decisionMatrix[0].length; // number of criteria
  
  // Step 1: Normalize the decision matrix
  const normalizedMatrix = [];
  for (let i = 0; i < m; i++) {
    normalizedMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      const column = decisionMatrix.map(row => row[j]);
      const max = Math.max(...column);
      const min = Math.min(...column);
      
      if (max === min) {
        normalizedMatrix[i][j] = 1; // If all values are same, set to 1
      } else if (criteriaTypes[j] === 'beneficial') {
        normalizedMatrix[i][j] = (decisionMatrix[i][j] - min) / (max - min);
      } else {
        normalizedMatrix[i][j] = (max - decisionMatrix[i][j]) / (max - min);
      }
      
      // Ensure normalized values are not zero for logarithm
      if (normalizedMatrix[i][j] <= 0) {
        normalizedMatrix[i][j] = 0.001;
      }
    }
  }
  
  // Step 2: Calculate overall performance with equal weights
  const overallPerformance = [];
  for (let i = 0; i < m; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += Math.log(normalizedMatrix[i][j]);
    }
    overallPerformance[i] = Math.log(1 + (1/n) * sum);
  }
  
  // Step 3: Calculate performance by removing each criterion
  const removalEffects = [];
  for (let j = 0; j < n; j++) {
    const performanceWithoutJ = [];
    for (let i = 0; i < m; i++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        if (k !== j) {
          sum += Math.log(normalizedMatrix[i][k]);
        }
      }
      performanceWithoutJ[i] = Math.log(1 + (1/(n-1)) * sum);
    }
    
    // Step 4: Calculate removal effect
    let effect = 0;
    for (let i = 0; i < m; i++) {
      effect += Math.abs(overallPerformance[i] - performanceWithoutJ[i]);
    }
    removalEffects[j] = effect;
  }
  
  // Step 5: Calculate final weights
  const totalEffect = removalEffects.reduce((sum, effect) => sum + effect, 0);
  const weights = removalEffects.map(effect => totalEffect > 0 ? effect / totalEffect : 1/n);
  
  return weights;
}

// AROMAN Algorithm Implementation (Fixed)
function calculateAROMAN(decisionMatrix, weights, criteriaTypes) {
  const m = decisionMatrix.length;
  const n = decisionMatrix[0].length;
  
  // Step 1: Linear normalization
  const linearNormalized = [];
  for (let i = 0; i < m; i++) {
    linearNormalized[i] = [];
    for (let j = 0; j < n; j++) {
      const column = decisionMatrix.map(row => row[j]);
      const max = Math.max(...column);
      const min = Math.min(...column);
      
      if (max === min) {
        linearNormalized[i][j] = 1;
      } else {
        linearNormalized[i][j] = (decisionMatrix[i][j] - min) / (max - min);
      }
    }
  }
  
  // Step 2: Vector normalization
  const vectorNormalized = [];
  for (let j = 0; j < n; j++) {
    const column = decisionMatrix.map(row => row[j]);
    const sumSquares = column.reduce((sum, val) => sum + val * val, 0);
    const norm = Math.sqrt(sumSquares);
    
    for (let i = 0; i < m; i++) {
      if (!vectorNormalized[i]) vectorNormalized[i] = [];
      vectorNormalized[i][j] = norm > 0 ? decisionMatrix[i][j] / norm : 0;
    }
  }
  
  // Step 3: Aggregated averaged normalization (β = 0.5)
  const aggregatedNormalized = [];
  for (let i = 0; i < m; i++) {
    aggregatedNormalized[i] = [];
    for (let j = 0; j < n; j++) {
      aggregatedNormalized[i][j] = (0.5 * linearNormalized[i][j] + 0.5 * vectorNormalized[i][j]) / 2;
    }
  }
  
  // Step 4: Multiply with weights
  const weightedMatrix = [];
  for (let i = 0; i < m; i++) {
    weightedMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      weightedMatrix[i][j] = weights[j] * aggregatedNormalized[i][j];
    }
  }
  
  // Step 5: Calculate Ki and Oi values
  const results = [];
  for (let i = 0; i < m; i++) {
    let Ki = 0; // sum of cost criteria
    let Oi = 0; // sum of benefit criteria
    
    for (let j = 0; j < n; j++) {
      if (criteriaTypes[j] === 'beneficial') {
        Oi += weightedMatrix[i][j];
      } else {
        Ki += weightedMatrix[i][j];
      }
    }
    
    // Step 6: Calculate final score (λ = 0.5)
    const lambda = 0.5;
    const score = Math.exp(Math.pow(Math.max(0, Oi), lambda) - Math.pow(Math.max(0, Ki), lambda));
    results.push({ alternative: i, Ki, Oi, score });
  }
  
  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);
  
  return results;
}

function App() {
  const [alternatives, setAlternatives] = useState(['Alternative 1', 'Alternative 2', 'Alternative 3'])
  const [criteria, setCriteria] = useState(['Criterion 1', 'Criterion 2', 'Criterion 3'])
  const [criteriaTypes, setCriteriaTypes] = useState(['beneficial', 'beneficial', 'beneficial'])
  const [decisionMatrix, setDecisionMatrix] = useState([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ])
  const [results, setResults] = useState(null)
  const [weights, setWeights] = useState(null)

  const addAlternative = () => {
    const newAlternatives = [...alternatives, `Alternative ${alternatives.length + 1}`]
    setAlternatives(newAlternatives)
    
    const newMatrix = [...decisionMatrix, new Array(criteria.length).fill(0)]
    setDecisionMatrix(newMatrix)
  }

  const deleteAlternative = (indexToDelete) => {
    const newAlternatives = alternatives.filter((_, index) => index !== indexToDelete);
    setAlternatives(newAlternatives);

    const newMatrix = decisionMatrix.filter((_, index) => index !== indexToDelete);
    setDecisionMatrix(newMatrix);

    setResults(null);
    setWeights(null);
  };

  const addCriterion = () => {
    const newCriteria = [...criteria, `Criterion ${criteria.length + 1}`]
    setCriteria(newCriteria)
    setCriteriaTypes([...criteriaTypes, 'beneficial'])
    
    const newMatrix = decisionMatrix.map(row => [...row, 0])
    setDecisionMatrix(newMatrix)
  }

  const deleteCriterion = (indexToDelete) => {
    const newCriteria = criteria.filter((_, index) => index !== indexToDelete);
    setCriteria(newCriteria);

    const newCriteriaTypes = criteriaTypes.filter((_, index) => index !== indexToDelete);
    setCriteriaTypes(newCriteriaTypes);

    const newMatrix = decisionMatrix.map(row => row.filter((_, index) => index !== indexToDelete));
    setDecisionMatrix(newMatrix);

    setResults(null);
    setWeights(null);
  };

  const updateMatrixValue = (i, j, value) => {
    const newMatrix = [...decisionMatrix]
    newMatrix[i][j] = parseFloat(value) || 0
    setDecisionMatrix(newMatrix)
  }

  const updateCriteriaType = (index, type) => {
    const newTypes = [...criteriaTypes]
    newTypes[index] = type
    setCriteriaTypes(newTypes)
  }

  const updateAlternativeName = (index, name) => {
    const newAlternatives = [...alternatives]
    newAlternatives[index] = name
    setAlternatives(newAlternatives)
  }

  const updateCriterionName = (index, name) => {
    const newCriteria = [...criteria]
    newCriteria[index] = name
    setCriteria(newCriteria)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data;
          if (data.length === 0) {
            alert('CSV file is empty or has no data rows.');
            return;
          }

          // Assuming the first column is alternatives, and subsequent columns are criteria
          const newAlternatives = data.map(row => row[Object.keys(row)[0]]);
          const newCriteria = Object.keys(data[0]).slice(1);
          
          // Determine criteria types (all beneficial by default, user can change in UI)
          const newCriteriaTypes = new Array(newCriteria.length).fill('beneficial');

          const newDecisionMatrix = data.map(row => 
            Object.values(row).slice(1).map(val => parseFloat(val) || 0)
          );

          setAlternatives(newAlternatives);
          setCriteria(newCriteria);
          setCriteriaTypes(newCriteriaTypes);
          setDecisionMatrix(newDecisionMatrix);
          setResults(null);
          setWeights(null);
        },
        error: (error) => {
          alert('Error parsing CSV file: ' + error.message);
          console.error('CSV parsing error:', error);
        }
      });
    }
  };

  const calculateResults = () => {
    try {
      // Validate input data
      if (decisionMatrix.some(row => row.some(val => val <= 0))) {
        alert('All values in the decision matrix must be positive numbers greater than 0.');
        return;
      }
      
      // Calculate weights using MEREC
      const calculatedWeights = calculateMEREC(decisionMatrix, criteriaTypes);
      setWeights(calculatedWeights);
      
      // Calculate rankings using AROMAN
      const rankings = calculateAROMAN(decisionMatrix, calculatedWeights, criteriaTypes);
      setResults(rankings);
    } catch (error) {
      alert('Error in calculation: ' + error.message);
      console.error('Calculation error:', error);
    }
  };

  const chartData = results ? results.map((result, index) => ({
    name: alternatives[result.alternative],
    score: parseFloat(result.score.toFixed(4)),
    rank: index + 1
  })) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">MEREC-AROMAN</h1>
          </div>
          <p className="text-xl text-gray-600">Sustainability Assessment Tool</p>
          <p className="text-sm text-gray-500 mt-2">
            Multi-Criteria Decision Making for Automotive Manufacturing Plants
          </p>
        </div>

        <Tabs defaultValue="input" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input">Data Input</TabsTrigger>
            <TabsTrigger value="calculation">Calculation</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alternatives</CardTitle>
                  <CardDescription>Define the automotive manufacturing plants to be evaluated</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {alternatives.map((alt, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={alt}
                        onChange={(e) => updateAlternativeName(index, e.target.value)}
                        placeholder={`Alternative ${index + 1}`}
                        className="flex-1"
                      />
                      {alternatives.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAlternative(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button onClick={addAlternative} variant="outline" className="w-full">
                    Add Alternative
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Criteria</CardTitle>
                  <CardDescription>Define the sustainability evaluation criteria and their types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {criteria.map((crit, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={crit}
                        onChange={(e) => updateCriterionName(index, e.target.value)}
                        placeholder={`Criterion ${index + 1}`}
                        className="flex-1"
                      />
                      <Select
                        value={criteriaTypes[index]}
                        onValueChange={(value) => updateCriteriaType(index, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beneficial">Benefit</SelectItem>
                          <SelectItem value="non-beneficial">Cost</SelectItem>
                        </SelectContent>
                      </Select>
                      {criteria.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCriterion(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button onClick={addCriterion} variant="outline" className="w-full">
                    Add Criterion
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Decision Matrix</CardTitle>
                <CardDescription>Enter the performance values for each alternative-criterion pair (all values must be positive)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alternative</TableHead>
                        {criteria.map((crit, index) => (
                          <TableHead key={index} className="text-center">
                            {crit}
                            <br />
                            <Badge variant={criteriaTypes[index] === 'beneficial' ? 'default' : 'secondary'} className="text-xs">
                              {criteriaTypes[index] === 'beneficial' ? 'Benefit' : 'Cost'}
                            </Badge>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alternatives.map((alt, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{alt}</TableCell>
                          {criteria.map((_, j) => (
                            <TableCell key={j}>
                              <Input
                                type="number"
                                value={decisionMatrix[i][j]}
                                onChange={(e) => updateMatrixValue(i, j, e.target.value)}
                                className="w-20 text-center"
                                step="0.1"
                                min="0.1"
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4">
                  <Label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CSV Data
                  </Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  MEREC-AROMAN Calculation
                </CardTitle>
                <CardDescription>
                  Calculate criteria weights using MEREC and rank alternatives using AROMAN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Methodology Overview:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li><strong>MEREC:</strong> Calculates objective criteria weights based on removal effects</li>
                      <li><strong>AROMAN:</strong> Ranks alternatives using two-step normalization</li>
                      <li>Results provide final sustainability performance ranking</li>
                    </ol>
                  </div>
                  
                  <Button onClick={calculateResults} className="w-full" size="lg">
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate MEREC-AROMAN
                  </Button>

                  {weights && (
                    <Card>
                      <CardHeader>
                        <CardTitle>MEREC Criteria Weights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {criteria.map((crit, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <div className="font-medium">{crit}</div>
                              <div className="text-2xl font-bold text-blue-600">
                                {(weights[index] * 100).toFixed(2)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {results && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    AROMAN Ranking Results
                  </CardTitle>
                  <CardDescription>Final ranking of alternatives based on MEREC-AROMAN methodology</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Alternative</TableHead>
                        <TableHead>Ki (Cost Sum)</TableHead>
                        <TableHead>Oi (Benefit Sum)</TableHead>
                        <TableHead>Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-bold">{index + 1}</TableCell>
                          <TableCell>{alternatives[result.alternative]}</TableCell>
                          <TableCell>{result.Ki.toFixed(4)}</TableCell>
                          <TableCell>{result.Oi.toFixed(4)}</TableCell>
                          <TableCell>{result.score.toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-6 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 20, right: 30, left: 20, bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="score" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App


