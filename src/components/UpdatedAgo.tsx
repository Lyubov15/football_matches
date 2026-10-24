import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

type Props = {
  since: Date;
};

export function UpdatedAgo({ since }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Считаем разницу в секундах от переданной даты
    const calculateSeconds = () => {
      const diff = Math.floor((Date.now() - since.getTime()) / 1000);
      setSeconds(diff >= 0 ? diff : 0);
    };

    calculateSeconds(); // Сразу при монтировании или смене since
    const interval = setInterval(calculateSeconds, 1000);

    return () => clearInterval(interval); // Очистка при размонтировании
  }, [since]); // Зависимость от since (при обновлении данных сбрасывается)

  return <Text style={styles.text}>Обновлено {seconds} сек назад</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    color: '#6b7280',
  },
});