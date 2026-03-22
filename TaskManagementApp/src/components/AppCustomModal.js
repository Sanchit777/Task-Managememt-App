import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AppCustomModal = ({ visible, onClose, title, message, type = 'success', actionText = 'OK', onAction }) => {
    const scaleAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

    const getIcon = () => {
        switch (type) {
            case 'success': return { name: 'check-circle', color: '#10b981' };
            case 'error': return { name: 'error', color: '#ef4444' };
            case 'warning': return { name: 'warning', color: '#f59e0b' };
            default: return { name: 'info', color: '#3b82f6' };
        }
    };

    const icon = getIcon();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                        <MaterialIcons name={icon.name} size={60} color={icon.color} />
                    </View>
                    
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    
                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: icon.color }]} 
                        onPress={onAction || onClose}
                    >
                        <Text style={styles.buttonText}>{actionText}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    }
});

export default AppCustomModal;
