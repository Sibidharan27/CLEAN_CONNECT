import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../theme';

const SkeletonItem = ({ width, height, borderRadius = BorderRadius.sm, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const backgroundColor = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.skeleton, Colors.skeletonHighlight],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

export const ComplaintCardSkeleton = () => (
  <View style={styles.card}>
    <View style={styles.row}>
      <SkeletonItem width={44} height={44} borderRadius={BorderRadius.md} />
      <View style={styles.cardContent}>
        <SkeletonItem width="70%" height={14} />
        <SkeletonItem width="40%" height={10} style={{ marginTop: 8 }} />
      </View>
      <SkeletonItem width={70} height={24} borderRadius={BorderRadius.full} />
    </View>
    <SkeletonItem width="90%" height={10} style={{ marginTop: 12 }} />
    <SkeletonItem width="60%" height={10} style={{ marginTop: 6 }} />
  </View>
);

export const NotificationSkeleton = () => (
  <View style={styles.notification}>
    <SkeletonItem width={40} height={40} borderRadius={20} />
    <View style={styles.notifContent}>
      <SkeletonItem width="60%" height={12} />
      <SkeletonItem width="90%" height={10} style={{ marginTop: 8 }} />
      <SkeletonItem width="30%" height={10} style={{ marginTop: 6 }} />
    </View>
  </View>
);

const SkeletonLoader = ({ type = 'complaint', count = 3 }) => {
  const Component = type === 'notification' ? NotificationSkeleton : ComplaintCardSkeleton;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => <Component key={i} />)}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: 12 },
  notification: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  notifContent: { flex: 1, marginLeft: 12 },
});

export default SkeletonLoader;
