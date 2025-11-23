/**
 * Calculator Disguise Screen
 * Panic button destination - looks like a normal calculator app
 * Provides safety for users who need to quickly hide the app
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function CalculatorScreen() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumberPress = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperationPress = (op: string) => {
    const current = parseFloat(display);
    
    if (previousValue !== null && operation && !newNumber) {
      // Perform previous operation
      const result = calculateResult(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(current);
    }
    
    setOperation(op);
    setNewNumber(true);
  };

  const calculateResult = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+':
        return prev + current;
      case '-':
        return prev - current;
      case '×':
        return prev * current;
      case '÷':
        return current !== 0 ? prev / current : 0;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const current = parseFloat(display);
      const result = calculateResult(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setNewNumber(false);
    }
  };

  // Secret: Triple tap the display to return to GutCheck
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleDisplayTap = () => {
    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }

    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount === 3) {
      // Triple tap detected - return to app
      router.back();
      setTapCount(0);
      return;
    }

    // Reset after 1 second
    const timeout = setTimeout(() => {
      setTapCount(0);
    }, 1000);
    setTapTimeout(timeout);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <SafeAreaView style={styles.container}>
        {/* Display */}
        <TouchableOpacity
          style={styles.displayContainer}
          onPress={handleDisplayTap}
          activeOpacity={0.9}
        >
          <Text style={styles.display} numberOfLines={1} adjustsFontSizeToFit>
            {display}
          </Text>
        </TouchableOpacity>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Row 1 */}
          <View style={styles.row}>
            <TouchableOpacity style={[styles.button, styles.buttonFunction]} onPress={handleClear}>
              <Text style={styles.buttonTextFunction}>AC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonFunction]} onPress={handleBackspace}>
              <Text style={styles.buttonTextFunction}>⌫</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonFunction]} onPress={() => handleOperationPress('%')}>
              <Text style={styles.buttonTextFunction}>%</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonOperation]} onPress={() => handleOperationPress('÷')}>
              <Text style={styles.buttonTextOperation}>÷</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('7')}>
              <Text style={styles.buttonText}>7</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('8')}>
              <Text style={styles.buttonText}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('9')}>
              <Text style={styles.buttonText}>9</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonOperation]} onPress={() => handleOperationPress('×')}>
              <Text style={styles.buttonTextOperation}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('4')}>
              <Text style={styles.buttonText}>4</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('5')}>
              <Text style={styles.buttonText}>5</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('6')}>
              <Text style={styles.buttonText}>6</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonOperation]} onPress={() => handleOperationPress('-')}>
              <Text style={styles.buttonTextOperation}>−</Text>
            </TouchableOpacity>
          </View>

          {/* Row 4 */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('1')}>
              <Text style={styles.buttonText}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('2')}>
              <Text style={styles.buttonText}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handleNumberPress('3')}>
              <Text style={styles.buttonText}>3</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonOperation]} onPress={() => handleOperationPress('+')}>
              <Text style={styles.buttonTextOperation}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Row 5 */}
          <View style={styles.row}>
            <TouchableOpacity style={[styles.button, styles.buttonWide]} onPress={() => handleNumberPress('0')}>
              <Text style={styles.buttonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleDecimal}>
              <Text style={styles.buttonText}>.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonEquals]} onPress={handleEquals}>
              <Text style={styles.buttonTextEquals}>=</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hidden hint */}
        <Text style={styles.hint}>Triple-tap display to return</Text>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  displayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  display: {
    fontSize: 64,
    fontWeight: '300',
    color: '#000000',
    textAlign: 'right',
  },
  buttonsContainer: {
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    margin: 5,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonWide: {
    flex: 2,
  },
  buttonFunction: {
    backgroundColor: '#E0E0E0',
  },
  buttonOperation: {
    backgroundColor: '#FF9500',
  },
  buttonEquals: {
    backgroundColor: '#43B897',
  },
  buttonText: {
    fontSize: 32,
    color: '#000000',
    fontWeight: '400',
  },
  buttonTextFunction: {
    fontSize: 28,
    color: '#000000',
    fontWeight: '500',
  },
  buttonTextOperation: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  buttonTextEquals: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hint: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#999999',
    opacity: 0.3,
  },
});

