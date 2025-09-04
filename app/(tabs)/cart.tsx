import { StyleSheet, Text, View } from 'react-native';

export default function CartScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Cart page coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 },
});
