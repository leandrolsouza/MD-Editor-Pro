/**
 * Custom ESLint Rule: component-resource-cleanup
 * Validates: Requirements 6.2 - Verify resources are released in cleanup methods
 * 
 * This rule checks that components with resource acquisition (file handles, connections, etc.)
 * have corresponding cleanup methods that release those resources.
 */

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require cleanup methods for components that acquire resources',
            category: 'Resource Management',
            recommended: true
        },
        messages: {
            missingCleanupMethod: 'Class "{{className}}" acquires resources but lacks a cleanup method (cleanup, destroy, or dispose). Add a cleanup method to release resources.',
            cleanupShouldReleaseResources: 'Cleanup method in class "{{className}}" should release acquired resources. Ensure all resources are properly closed or released.'
        },
        schema: []
    },

    create(context) {
        const classesWithResources = new Map();

        /**
         * Resource acquisition patterns
         */
        const resourcePatterns = [
            'createReadStream',
            'createWriteStream',
            'open', // fs.open
            'openSync',
            'readFile',
            'writeFile',
            'createConnection',
            'connect',
            'createServer',
            'BrowserWindow', // Electron windows
            'Tray', // Electron tray
            'Menu' // Electron menu
        ];

        /**
         * Check if a call expression acquires a resource
         */
        function isResourceAcquisition(node) {
            if (node.type !== 'CallExpression') return false;

            const callee = node.callee;

            // Check for direct function calls
            if (callee.type === 'Identifier' &&
                resourcePatterns.includes(callee.name)) {
                return true;
            }

            // Check for method calls
            if (callee.type === 'MemberExpression' &&
                callee.property.type === 'Identifier' &&
                resourcePatterns.includes(callee.property.name)) {
                return true;
            }

            // Check for new expressions (constructors)
            if (node.type === 'NewExpression' &&
                callee.type === 'Identifier' &&
                resourcePatterns.includes(callee.name)) {
                return true;
            }

            return false;
        }

        /**
         * Check if class has cleanup method
         */
        function hasCleanupMethod(classNode) {
            const body = classNode.body.body || [];

            return body.some(member =>
                member.type === 'MethodDefinition' &&
                (member.key.name === 'cleanup' ||
                    member.key.name === 'destroy' ||
                    member.key.name === 'dispose' ||
                    member.key.name === 'close' ||
                    member.key.name === 'componentWillUnmount')
            );
        }

        /**
         * Get cleanup method from class
         */
        function getCleanupMethod(classNode) {
            const body = classNode.body.body || [];

            return body.find(member =>
                member.type === 'MethodDefinition' &&
                (member.key.name === 'cleanup' ||
                    member.key.name === 'destroy' ||
                    member.key.name === 'dispose' ||
                    member.key.name === 'close' ||
                    member.key.name === 'componentWillUnmount')
            );
        }

        /**
         * Check if cleanup method releases resources
         */
        function cleanupReleasesResources(cleanupMethod, resourceProperties) {
            if (!cleanupMethod || !cleanupMethod.value || !cleanupMethod.value.body) {
                return false;
            }

            const body = cleanupMethod.value.body.body || [];
            const visited = new WeakSet();

            function hasResourceRelease(n) {
                if (!n || typeof n !== 'object') return false;

                if (visited.has(n)) return false;
                visited.add(n);

                // Check for close() calls
                if (n.type === 'CallExpression' &&
                    n.callee.type === 'MemberExpression' &&
                    (n.callee.property.name === 'close' ||
                        n.callee.property.name === 'destroy' ||
                        n.callee.property.name === 'end' ||
                        n.callee.property.name === 'removeAllListeners')) {
                    return true;
                }

                // Check for setting properties to null
                if (n.type === 'AssignmentExpression' &&
                    n.right.type === 'Literal' &&
                    n.right.value === null) {
                    return true;
                }

                // Recursively check child nodes
                for (const key in n) {
                    if (key === 'parent') continue;

                    if (n[key] && typeof n[key] === 'object') {
                        if (Array.isArray(n[key])) {
                            if (n[key].some(hasResourceRelease)) return true;
                        } else {
                            if (hasResourceRelease(n[key])) return true;
                        }
                    }
                }

                return false;
            }

            return body.some(hasResourceRelease);
        }

        return {
            ClassDeclaration(node) {
                const className = node.id ? node.id.name : 'anonymous';
                classesWithResources.set(node, {
                    name: className,
                    resourceProperties: new Set(),
                    hasResources: false
                });
            },

            ClassExpression(node) {
                const className = node.id ? node.id.name : 'anonymous';
                classesWithResources.set(node, {
                    name: className,
                    resourceProperties: new Set(),
                    hasResources: false
                });
            },

            CallExpression(node) {
                if (isResourceAcquisition(node)) {
                    // Find parent class
                    let current = node;
                    while (current) {
                        if (current.type === 'ClassDeclaration' || current.type === 'ClassExpression') {
                            const classInfo = classesWithResources.get(current);
                            if (classInfo) {
                                classInfo.hasResources = true;

                                // Track property if assigned
                                const parent = node.parent;
                                if (parent.type === 'AssignmentExpression' &&
                                    parent.left.type === 'MemberExpression' &&
                                    parent.left.object.type === 'ThisExpression') {
                                    classInfo.resourceProperties.add(parent.left.property.name);
                                }
                            }
                            break;
                        }
                        current = current.parent;
                    }
                }
            },

            NewExpression(node) {
                if (isResourceAcquisition(node)) {
                    // Find parent class
                    let current = node;
                    while (current) {
                        if (current.type === 'ClassDeclaration' || current.type === 'ClassExpression') {
                            const classInfo = classesWithResources.get(current);
                            if (classInfo) {
                                classInfo.hasResources = true;

                                // Track property if assigned
                                const parent = node.parent;
                                if (parent.type === 'AssignmentExpression' &&
                                    parent.left.type === 'MemberExpression' &&
                                    parent.left.object.type === 'ThisExpression') {
                                    classInfo.resourceProperties.add(parent.left.property.name);
                                }
                            }
                            break;
                        }
                        current = current.parent;
                    }
                }
            },

            'Program:exit'() {
                for (const [classNode, classInfo] of classesWithResources) {
                    if (!classInfo.hasResources) {
                        continue;
                    }

                    // Check if class has cleanup method
                    if (!hasCleanupMethod(classNode)) {
                        context.report({
                            node: classNode,
                            messageId: 'missingCleanupMethod',
                            data: { className: classInfo.name }
                        });
                        continue;
                    }

                    // Check if cleanup method releases resources
                    const cleanupMethod = getCleanupMethod(classNode);
                    if (cleanupMethod && !cleanupReleasesResources(cleanupMethod, classInfo.resourceProperties)) {
                        context.report({
                            node: cleanupMethod,
                            messageId: 'cleanupShouldReleaseResources',
                            data: { className: classInfo.name }
                        });
                    }
                }
            }
        };
    }
};
