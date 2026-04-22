pipeline {
    agent any
    triggers {
        githubPush()
    }
    environment {
        BACKEND_IMAGE      = "aycha123/mon-dashboard-backend"
        FRONTEND_IMAGE     = "aycha123/mon-dashboard-frontend"
        IMAGE_TAG          = "v${BUILD_NUMBER}"
        SONAR_PROJECT_KEY  = "mon-project"
        SONAR_PROJECT_NAME = "mon-project"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Tools') {
            steps {
                sh '''
                    echo "=== Checking tools ==="
                    python3 --version || true
                    node --version    || true
                    docker --version  || true
                    docker compose version || true
                    /usr/bin/trivy --version || echo "Trivy non accessible"
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
                                nvm use 20
                                npm ci
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
                        nvm use 20
                        npm run build
                    '''
                }
            }
        }

        // ====================== SONARQUBE ======================
        stage('SonarQube Analysis') {
            steps {
                script {
                    try {
                        def scannerHome = tool 'SonarQube Scanner'
                        withSonarQubeEnv('sonarqube') {
                            sh "${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                                -Dsonar.projectName=\"${SONAR_PROJECT_NAME}\" \
                                -Dsonar.sources=. \
                                -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/venv/**,**/.git/**"
                        }
                        echo "✅ SonarQube Analysis completed"
                    } catch (e) {
                        echo "⚠️ SonarQube failed: ${e}"
                    }
                }
            }
        }

        // ====================== SNYK ======================
        stage('Snyk Security Scan') {
            steps {
                script {
                    try {
                        snykSecurity(
                            snykInstallation: 'Snyk',
                            snykTokenId: 'snyk-token',
                            failOnIssues: false,
                            monitorProjectOnBuild: true,
                            additionalArguments: '--all-projects --detection-depth=4'
                        )
                        echo "✅ Snyk completed"
                    } catch (e) {
                        echo "⚠️ Snyk failed: ${e}"
                    }
                }
            }
        }

        // ====================== TRIVY FS ======================
        stage('Trivy Filesystem Scan') {
            steps {
                sh '''
                    mkdir -p trivy-templates
                    wget -q -O trivy-templates/html.tpl \
                        https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/html.tpl || true

                    /usr/bin/trivy fs \
                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                        --pkg-types os,library \
                        --format template \
                        --template "@trivy-templates/html.tpl" \
                        --output trivy-fs-report.html \
                        --ignore-unfixed \
                        --skip-version-check \
                        . || true
                '''
                archiveArtifacts artifacts: 'trivy-fs-report.html', allowEmptyArchive: true
            }
        }

        // ====================== BUILD DOCKER ======================
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

        // ====================== TRIVY IMAGES — SÉQUENTIEL ======================
        stage('Trivy Backend Image Scan') {
            steps {
                sh '''
                    /usr/bin/trivy image \
                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                        --pkg-types os,library \
                        --format template \
                        --template "@trivy-templates/html.tpl" \
                        --output trivy-backend-image.html \
                        --ignore-unfixed \
                        --skip-version-check \
                        $BACKEND_IMAGE:$IMAGE_TAG || true
                '''
                archiveArtifacts artifacts: 'trivy-backend-image.html', allowEmptyArchive: true
            }
        }

        stage('Trivy Frontend Image Scan') {
            steps {
                sh '''
                    /usr/bin/trivy image \
                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                        --pkg-types os,library \
                        --format template \
                        --template "@trivy-templates/html.tpl" \
                        --output trivy-frontend-image.html \
                        --ignore-unfixed \
                        --skip-version-check \
                        $FRONTEND_IMAGE:$IMAGE_TAG || true
                '''
                archiveArtifacts artifacts: 'trivy-frontend-image.html', allowEmptyArchive: true
            }
        }

        // ====================== DOCKER LOGIN ======================
        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub',
                    usernameVariable: 'USER',
                    passwordVariable: 'PASS'
                )]) {
                    sh 'echo $PASS | docker login -u $USER --password-stdin'
                }
            }
        }

        // ====================== PUSH ======================
        stage('Push Images') {
            parallel {
                stage('Backend') {
                    steps {
                        sh '''
                            docker push $BACKEND_IMAGE:$IMAGE_TAG
                            docker push $BACKEND_IMAGE:latest
                        '''
                    }
                }
                stage('Frontend') {
                    steps {
                        sh '''
                            docker push $FRONTEND_IMAGE:$IMAGE_TAG
                            docker push $FRONTEND_IMAGE:latest
                        '''
                    }
                }
            }
        }

        // ====================== DEPLOY ======================
        stage('Deploy') {
            steps {
                sh '''
                    # Libérer port 5000 si occupé
                    fuser -k 5000/tcp || true

                    docker compose pull  || true
                    docker compose down --remove-orphans || true
                    docker compose up -d --force-recreate
                    docker image prune -f
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline réussi → Application déployée'
        }
        failure {
            echo '❌ Pipeline échoué'
        }
        always {
            script {
                try {
                    publishHTML(target: [
                        allowMissing         : true,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : '.',
                        reportFiles          : 'trivy-*.html',
                        reportName           : '📊 Trivy Reports'
                    ])
                } catch (e) {
                    echo "⚠️ publishHTML non disponible"
                }
            }
            sh 'docker logout || true'
            cleanWs()
        }
    }
}