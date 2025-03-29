import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  FlatList,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';

// Get the screen dimensions
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_SIZE = 15;
const CELL_SIZE = Math.floor(SCREEN_WIDTH / GRID_SIZE);

// Direction constants
const Direction = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

// Initial snake position
const initialSnake = [{ x: 5, y: 5 }];

// Game difficulty settings
const DIFFICULTY_LEVELS = [
  { level: 'Easy', speed: 300, obstacleCount: 3 },
  { level: 'Medium', speed: 200, obstacleCount: 5 },
  { level: 'Hard', speed: 150, obstacleCount: 8 },
];

// Food types with point values
const FOOD_TYPES = [
  { type: 'regular', points: 1, color: 'red' },
  { type: 'bonus', points: 3, color: 'gold' },
  { type: 'super', points: 5, color: 'purple' },
];

export default function SnakeGameAPI() {
  // Game state
  const [snake, setSnake] = useState(initialSnake);
  const [foods, setFoods] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [direction, setDirection] = useState(Direction.RIGHT);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS[0]);

  // API data state
  const [foodQuotes, setFoodQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Game loop using useRef and useEffect
  const gameLoopRef = useRef(null);
  
  // Fetch quotes from API to use as food "power" descriptions
  useEffect(() => {
    fetchQuotes();
  }, []);
  
  // Function to fetch quotes from API
  const fetchQuotes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Using the Quotable API to get random quotes for our food descriptions
      const response = await axios.get('https://api.quotable.io/quotes/random?limit=25');
      setFoodQuotes(response.data);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError('Failed to fetch food power descriptions. Please try again.');
      // Use fallback data if API fails
      setFoodQuotes([
        { _id: '1', content: 'Extra speed boost!', author: 'System' },
        { _id: '2', content: 'Double points for 10 seconds!', author: 'System' },
        { _id: '3', content: 'Immunity to obstacles!', author: 'System' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch high scores from API
  const fetchHighScores = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an actual API endpoint
      // Simulating API response with setTimeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock high scores data (in a real app this would come from the API)
      const mockHighScores = [
        { id: '1', name: 'Alex', score: 42, level: 'Medium' },
        { id: '2', name: 'Jordan', score: 36, level: 'Hard' },
        { id: '3', name: 'Taylor', score: 30, level: 'Easy' },
        { id: '4', name: 'Casey', score: 28, level: 'Medium' },
        { id: '5', name: 'Riley', score: 25, level: 'Hard' },
      ];
      
      setHighScores(mockHighScores);
    } catch (err) {
      console.error('Error fetching high scores:', err);
      setError('Failed to fetch high scores. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize or reset the game
  useEffect(() => {
    if (!isPaused && !isGameOver) {
      generateInitialFoods();
      generateObstacles();
      startGameLoop();
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPaused, isGameOver, difficulty]);
  
  // Start the game loop
  const startGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    gameLoopRef.current = setInterval(moveSnake, difficulty.speed);
  };
  
  // Generate random food items
  const generateInitialFoods = () => {
    const newFoods = [];
    
    // Generate 3 food items
    for (let i = 0; i < 3; i++) {
      const foodType = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
      
      // Get a random quote for this food
      const randomQuote = foodQuotes.length > 0 
        ? foodQuotes[Math.floor(Math.random() * foodQuotes.length)] 
        : { content: 'Power-up!', author: 'System' };
      
      let newFood;
      let isValidPosition;
      
      do {
        isValidPosition = true;
        newFood = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
          type: foodType.type,
          points: foodType.points,
          color: foodType.color,
          quote: `${randomQuote.content} (${foodType.points} pts)`,
        };
        
        // Make sure food doesn't appear on the snake
        if (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
          isValidPosition = false;
          continue;
        }
        
        // Make sure food doesn't appear on other foods
        if (newFoods.some(food => food.x === newFood.x && food.y === newFood.y)) {
          isValidPosition = false;
        }
      } while (!isValidPosition);
      
      newFoods.push(newFood);
    }
    
    setFoods(newFoods);
  };
  
  // Generate obstacles
  const generateObstacles = () => {
    const newObstacles = [];
    
    for (let i = 0; i < difficulty.obstacleCount; i++) {
      let newObstacle;
      let isValidPosition;
      
      do {
        isValidPosition = true;
        newObstacle = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
        
        // Make sure obstacle doesn't appear on the snake
        if (snake.some(segment => segment.x === newObstacle.x && segment.y === newObstacle.y)) {
          isValidPosition = false;
          continue;
        }
        
        // Make sure obstacle doesn't appear on food
        if (foods.some(food => food.x === newObstacle.x && food.y === newObstacle.y)) {
          isValidPosition = false;
          continue;
        }
        
        // Make sure obstacle doesn't appear on other obstacles
        if (newObstacles.some(obs => obs.x === newObstacle.x && obs.y === newObstacle.y)) {
          isValidPosition = false;
        }
      } while (!isValidPosition);
      
      newObstacles.push(newObstacle);
    }
    
    setObstacles(newObstacles);
  };
  
  // Check for collisions
  const checkCollision = (head) => {
    // Check wall collision
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      return true;
    }
    
    // Check self collision (skip the last piece as it will move)
    for (let i = 0; i < snake.length - 1; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        return true;
      }
    }
    
    // Check obstacle collision
    if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
      return true;
    }
    
    return false;
  };
  
  // Move the snake
  const moveSnake = () => {
    const head = { ...snake[0] };
    const newHead = {
      x: head.x + direction.x,
      y: head.y + direction.y,
    };
    
    if (checkCollision(newHead)) {
      endGame();
      return;
    }
    
    const newSnake = [newHead, ...snake];
    
    // Check if the snake eats food
    const foodEaten = foods.findIndex(food => food.x === newHead.x && food.y === newHead.y);
    
    if (foodEaten !== -1) {
      // Add points based on food type
      setScore(prevScore => prevScore + foods[foodEaten].points);
      
      // Show the quote from the food
      Alert.alert(
        "Power-up!",
        foods[foodEaten].quote,
        [{ text: "Continue", onPress: () => setIsPaused(false) }]
      );
      setIsPaused(true);
      
      // Remove the eaten food
      const newFoods = [...foods];
      newFoods.splice(foodEaten, 1);
      
      // Generate a new food item to replace the eaten one
      const foodType = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
      const randomQuote = foodQuotes.length > 0 
        ? foodQuotes[Math.floor(Math.random() * foodQuotes.length)] 
        : { content: 'Power-up!', author: 'System' };
      
      let newFood;
      let isValidPosition;
      
      do {
        isValidPosition = true;
        newFood = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
          type: foodType.type,
          points: foodType.points,
          color: foodType.color,
          quote: `${randomQuote.content} (${foodType.points} pts)`,
        };
        
        // Make sure new food doesn't appear on the snake
        if (newSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
          isValidPosition = false;
          continue;
        }
        
        // Make sure new food doesn't appear on other foods
        if (newFoods.some(food => food.x === newFood.x && food.y === newFood.y)) {
          isValidPosition = false;
          continue;
        }
        
        // Make sure new food doesn't appear on obstacles
        if (obstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y)) {
          isValidPosition = false;
        }
      } while (!isValidPosition);
      
      newFoods.push(newFood);
      setFoods(newFoods);
    } else {
      // Remove the tail segment if no food was eaten
      newSnake.pop();
    }
    
    setSnake(newSnake);
  };
  
  // Handle direction changes
  const changeDirection = (newDirection) => {
    // Prevent 180-degree turns
    if (
      (direction === Direction.UP && newDirection === Direction.DOWN) ||
      (direction === Direction.DOWN && newDirection === Direction.UP) ||
      (direction === Direction.LEFT && newDirection === Direction.RIGHT) ||
      (direction === Direction.RIGHT && newDirection === Direction.LEFT)
    ) {
      return;
    }
    
    setDirection(newDirection);
  };
  
  // End the game and fetch high scores
  const endGame = () => {
    setIsGameOver(true);
    setIsPaused(true);
    clearInterval(gameLoopRef.current);
    
    // Fetch high scores when game ends
    fetchHighScores();
    
    Alert.alert(
      "Game Over",
      `Your score: ${score}. Difficulty: ${difficulty.level}`,
      [
        { text: "Try Again", onPress: resetGame }
      ]
    );
  };
  
  // Reset the game
  const resetGame = () => {
    setSnake(initialSnake);
    setDirection(Direction.RIGHT);
    setIsGameOver(false);
    setScore(0);
    setFoods([]);
    setObstacles([]);
    // Fetch new quotes when resetting
    fetchQuotes();
  };
  
  // Change difficulty level
  const changeDifficulty = (newDifficulty) => {
    setDifficulty(newDifficulty);
    if (!isPaused && !isGameOver) {
      resetGame();
    }
  };
  
  // Render a grid cell
  const renderCell = (x, y) => {
    // Check if cell is snake
    const isSnake = snake.some(segment => segment.x === x && segment.y === y);
    
    // Check if cell is snake head
    const isHead = snake.length > 0 && snake[0].x === x && snake[0].y === y;
    
    // Check if cell is food
    const food = foods.find(food => food.x === x && food.y === y);
    
    // Check if cell is obstacle
    const isObstacle = obstacles.some(obs => obs.x === x && obs.y === y);
    
    return (
      <View
        key={`${x}-${y}`}
        style={[
          styles.cell,
          isSnake && styles.snakeCell,
          isHead && styles.snakeHead,
          isObstacle && styles.obstacleCell,
          food && { backgroundColor: food.color },
        ]}
      />
    );
  };
  
  // Render the game grid
  const renderGrid = () => {
    const grid = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        grid.push(renderCell(x, y));
      }
    }
    
    return (
      <View style={styles.grid}>
        {grid}
      </View>
    );
  };
  
  // Render high score item
  const renderHighScoreItem = ({ item, index }) => (
    <View style={styles.highScoreItem}>
      <Text style={styles.rankText}>{index + 1}</Text>
      <Text style={styles.nameText}>{item.name}</Text>
      <Text style={styles.scoreValueText}>{item.score}</Text>
      <Text style={styles.levelText}>{item.level}</Text>
    </View>
  );
  
  // Render food info item
  const renderFoodInfoItem = ({ item }) => (
    <View style={[styles.foodInfoItem, { backgroundColor: item.color }]}>
      <Text style={styles.foodTypeText}>{item.type}</Text>
      <Text style={styles.foodPointsText}>{item.points} pts</Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3e50" />
          <Text style={styles.loadingText}>Loading game data...</Text>
        </View>
      ) : (
        <>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchQuotes}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>API Snake Game</Text>
              
              {/* Game Info */}
              <View style={styles.infoContainer}>
                <Text style={styles.scoreText}>Score: {score}</Text>
                <Text style={styles.difficultyText}>Difficulty: {difficulty.level}</Text>
              </View>
              
              {/* Game Grid */}
              {renderGrid()}
              
              {/* Difficulty Selection */}
              <View style={styles.difficultyContainer}>
                {DIFFICULTY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.level}
                    style={[
                      styles.difficultyButton,
                      difficulty.level === level.level && styles.selectedDifficulty
                    ]}
                    onPress={() => changeDifficulty(level)}
                  >
                    <Text style={styles.difficultyButtonText}>{level.level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Game Controls */}
              <View style={styles.controls}>
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={() => changeDirection(Direction.UP)}
                >
                  <Text style={styles.buttonText}>↑</Text>
                </TouchableOpacity>
                
                <View style={styles.horizontalControls}>
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => changeDirection(Direction.LEFT)}
                  >
                    <Text style={styles.buttonText}>←</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => changeDirection(Direction.DOWN)}
                  >
                    <Text style={styles.buttonText}>↓</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => changeDirection(Direction.RIGHT)}
                  >
                    <Text style={styles.buttonText}>→</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Game Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, isPaused ? styles.startButton : styles.pauseButton]} 
                  onPress={() => {
                    if (isGameOver) {
                      resetGame();
                    }
                    setIsPaused(!isPaused);
                  }}
                >
                  <Text style={styles.actionButtonText}>
                    {isGameOver ? "New Game" : (isPaused ? "Start" : "Pause")}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={resetGame}
                >
                  <Text style={styles.actionButtonText}>Reset</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={fetchQuotes}
                >
                  <Text style={styles.actionButtonText}>Refresh Quotes</Text>
                </TouchableOpacity>
              </View>
              
              {/* Food Types Info */}
              <View style={styles.foodInfoContainer}>
                <Text style={styles.sectionTitle}>Food Types:</Text>
                <FlatList
                  data={FOOD_TYPES}
                  renderItem={renderFoodInfoItem}
                  keyExtractor={item => item.type}
                  horizontal
                  style={styles.foodInfoList}
                />
              </View>
              
              {/* High Scores */}
              <View style={styles.highScoresContainer}>
                <Text style={styles.sectionTitle}>High Scores:</Text>
                {highScores.length > 0 ? (
                  <FlatList
                    data={highScores}
                    renderItem={renderHighScoreItem}
                    keyExtractor={item => item.id}
                    style={styles.highScoresList}
                  />
                ) : (
                  <Text style={styles.noScoresText}>No high scores available</Text>
                )}
              </View>
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  difficultyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  grid: {
    width: CELL_SIZE * GRID_SIZE,
    height: CELL_SIZE * GRID_SIZE,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 2,
    borderColor: '#34495e',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: '#bdc3c7',
  },
  snakeCell: {
    backgroundColor: '#27ae60',
  },
  snakeHead: {
    backgroundColor: '#2ecc71',
  },
  obstacleCell: {
    backgroundColor: '#7f8c8d',
  },
  difficultyContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  difficultyButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
    borderRadius: 5,
  },
  selectedDifficulty: {
    backgroundColor: '#3498db',
  },
  difficultyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  controls: {
    marginTop: 10,
    alignItems: 'center',
  },
  horizontalControls: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    width: 50,
    height: 50,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
    borderRadius: 5,
  },
  startButton: {
    backgroundColor: '#2ecc71',
  },
  pauseButton: {
    backgroundColor: '#f39c12',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  foodInfoContainer: {
    width: '90%',
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50',
  },
  foodInfoList: {
    maxHeight: 60,
  },
  foodInfoItem: {
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodTypeText: {
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  foodPointsText: {
    color: 'white',
  },
  highScoresContainer: {
    width: '90%',
    marginTop: 15,
    maxHeight: 150,
  },
  highScoresList: {
    maxHeight: 120,
  },
  highScoreItem: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  rankText: {
    width: '10%',
    fontWeight: 'bold',
  },
  nameText: {
    width: '40%',
    fontWeight: 'bold',
  },
  scoreValueText: {
    width: '25%',
    textAlign: 'right',
  },
  levelText: {
    width: '25%',
    textAlign: 'right',
    color: '#7f8c8d',
  },
  noScoresText: {
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
});