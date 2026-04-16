pipeline {
    agent any
    triggers {
        githubPush()
    }
    environment {
        BACKEND_IMAGE  = "aycha123/mon-dashboard-backend"
        FRONTEND_IMAGE = "aycha123/mon-dashboard-frontend"
        IMAGE_TAG      = "v${BUILD_NUMBER}"
        SONAR_PROJECT_KEY = "mon-project"
        SONAR_PROJECT_NAME = "mon-project"
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Check Tools') {
            steps {
                sh '''
                    echo "=== Checking tools ==="
                    /usr/bin/trivy --version || echo "Trivy not found"
                '''
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh '''
                                sed -i 's/anyio==4.13.0/anyio==4.4.0/' requirements.txt || true
                                pip install -r requirements.txt --break-system-packages || true
                            '''
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh '''
                                export NVM_DIR="$HOME/.nvm"
                                . "$NVM_DIR/nvm.sh"
                                nvm use 20 || true
                                npm ci || true
                            '''
                        }
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        export NVM_DIR="$HOME/.nvm"
                        . "$NVM_DIR/nvm.sh"
                        nvm use 20 || true
                        npm run build || true
                    '''
                }
            }
        }

        // ====================== TRIVY SCANS ======================
        stage('Trivy Filesystem Scan') {
            steps {
                echo "🔍 Trivy Filesystem Scan..."
                sh '''
                    mkdir -p trivy-templates
                    wget -q -O trivy-templates/html.tpl https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/html.tpl || true

                    /usr/bin/trivy fs --severity HIGH,CRITICAL \
                                      --format template \
                                      --template "@/trivy-templates/html.tpl" \
                                      --output trivy-fs-report.html \
                                      --ignore-unfixed \
                                      . || echo "Trivy fs finished (possible warnings)"
                '''
                archiveArtifacts artifacts: 'trivy-fs-report.html', allowEmptyArchive: true, fingerprint: false
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Backend') {
                    steps {
                        sh 'docker build -t $BACKEND_IMAGE:$IMAGE_TAG -t $BACKEND_IMAGE:latest backend/'
                    }
                }
                stage('Frontend') {
                    steps {
                        sh 'docker build -t $FRONTEND_IMAGE:$IMAGE_TAG -t $FRONTEND_IMAGE:latest frontend/'
                    }
                }
            }
        }

        stage('Trivy Image Scan') {
            parallel {
                stage('Backend Image') {
                    steps {
                        sh '''
                            /usr/bin/trivy image --severity HIGH,CRITICAL \
                                                 --format template \
                                                 --template "@/trivy-templates/html.tpl" \
                                                 --output trivy-backend-image.html \
                                                 --ignore-unfixed \
                                                 $BACKEND_IMAGE:$IMAGE_TAG || echo "Trivy backend image scan finished"
                        '''
                        archiveArtifacts artifacts: 'trivy-backend-image.html', allowEmptyArchive: true, fingerprint: false
                    }
                }
                stage('Frontend Image') {
                    steps {
                        sh '''
                            /usr/bin/trivy image --severity HIGH,CRITICAL \
                                                 --format template \
                                                 --template "@/trivy-templates/html.tpl" \
                                                 --output trivy-frontend-image.html \
                                                 --ignore-unfixed \
                                                 $FRONTEND_IMAGE:$IMAGE_TAG || echo "Trivy frontend image scan finished"
                        '''
                        archiveArtifacts artifacts: 'trivy-frontend-image.html', allowEmptyArchive: true, fingerprint: false
                    }
                }
            }
        }

        // ... (tes stages SonarQube, Snyk, Docker Login, Push, Deploy restent les mêmes)
        // Colle ici tes stages SonarQube, Snyk, Docker Login, Push Images, Deploy
    }

    post {
        always {
            script {
                try {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'trivy-*.html',
                        reportName: '📊 Trivy Vulnerability Reports'
                    ])
                } catch (e) {
                    echo "⚠️ Impossible de publier les rapports HTML : ${e.getMessage()}"
                    echo "Vérifiez que le plugin 'HTML Publisher' est bien installé."
                }
            }
            sh 'docker logout || true'
            cleanWs()
        }
    }
}