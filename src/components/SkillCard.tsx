import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  skill: string;          // the skill name, e.g., "Push-ups"
  level: number;          // current level of the skill, e.g., 23
  icon: any;              // the icon image source
};

const SkillCard = ({ skill, level, icon }: Props) => {
  return (
    <View style={styles.card}>
      <Image source={icon} style={styles.icon} resizeMode="contain" />
      <View style={styles.info}>
        <Text style={styles.skillName}>{skill}</Text>
        <Text style={styles.level}>Level: {level}</Text>
      </View>
    </View>
  );
};

export default SkillCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  icon: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  info: {
    flexDirection: 'column',
  },
  skillName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  level: {
    fontSize: 16,
    color: '#555',
  },
});
